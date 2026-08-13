import { ManualAdjustment, OdooExportRecord, OdooConfig } from '../../types';
import { OdooConnector } from './OdooConnector';
import { OdooDataMapper } from './OdooDataMapper';
import { OdooErrorLogService } from './OdooErrorLogService';

export class OdooJournalExportService {
  /**
   * Generates a deterministic idempotency key for an adjustment export
   */
  static generateIdempotencyKey(adjustmentId: string, legalEntityId: string): string {
    return `IDEM-${legalEntityId}-${adjustmentId}`;
  }

  /**
   * Main export workflow: Checks approval, checks idempotency, posts to Odoo, updates status
   */
  static async exportAdjustmentToOdoo(
    adjustment: ManualAdjustment,
    config: OdooConfig
  ): Promise<{
    success: boolean;
    exportRecord: OdooExportRecord;
    error?: string;
  }> {
    const idempotencyKey =
      adjustment.odooIdempotencyKey ||
      OdooJournalExportService.generateIdempotencyKey(adjustment.id, adjustment.legal_entity_id);

    // RULE 1: No journal entry exports to Odoo without required approval
    if (adjustment.status !== 'APPROVED' && adjustment.status !== 'POSTED_TO_ODOO') {
      const failedRecord: OdooExportRecord = {
        id: `EXP-FAIL-${Date.now()}`,
        tenant_id: adjustment.tenant_id,
        group_id: adjustment.group_id,
        legal_entity_id: adjustment.legal_entity_id,
        adjustmentId: adjustment.id,
        idempotencyKey,
        amount: adjustment.amount,
        currency: adjustment.transaction_currency || 'ETB',
        reconCategory: adjustment.category,
        status: 'FAILED',
        errorMessage: 'EXPORT_REJECTED: Adjustment must be in APPROVED state before exporting to Odoo.',
        approvedBy: adjustment.approvedBy || 'Unapproved',
        approvedAtUtc: adjustment.approvedAt || new Date().toISOString(),
        retryCount: 0,
      };
      OdooErrorLogService.logExport(failedRecord);
      return {
        success: false,
        exportRecord: failedRecord,
        error: 'Adjustment is not approved. Exports require explicit Maker-Checker approval.',
      };
    }

    // RULE 2: Idempotency Check — Prevent duplicate exports
    const existingExports = OdooErrorLogService.getExportRecords();
    const duplicate = existingExports.find(
      (e) => e.idempotencyKey === idempotencyKey && e.status === 'SUCCESS'
    );

    if (duplicate) {
      return {
        success: true,
        exportRecord: duplicate,
        error: `Idempotency guard: Adjustment ${adjustment.id} was already posted to Odoo as ${duplicate.odoo_reference}.`,
      };
    }

    // Retrieve Mapping
    const mapping = OdooDataMapper.getMappingForCategory(
      adjustment.category,
      adjustment.legal_entity_id
    );

    // Prepare Odoo Payload
    const payload = OdooDataMapper.mapAdjustmentToOdooJournalEntry(adjustment, mapping);

    try {
      // Call Odoo Connector
      const rpcResult = await OdooConnector.executeRpcCall(
        config,
        payload.model,
        payload.method,
        payload.args,
        payload.kwargs
      );

      if (!rpcResult.success) {
        throw new Error(rpcResult.error || 'Odoo RPC execution failed');
      }

      const odooRef = rpcResult.data?.name || `JOURNAL/${Date.now()}`;
      const entryId = String(rpcResult.data?.id || Math.floor(Math.random() * 100000));
      const nowUtc = new Date().toISOString();

      const successRecord: OdooExportRecord = {
        id: `EXP-${Date.now()}`,
        tenant_id: adjustment.tenant_id,
        group_id: adjustment.group_id,
        legal_entity_id: adjustment.legal_entity_id,
        adjustmentId: adjustment.id,
        idempotencyKey,
        odoo_reference: odooRef,
        journalEntryId: entryId,
        amount: adjustment.amount,
        currency: adjustment.transaction_currency || 'ETB',
        reconCategory: adjustment.category,
        status: 'SUCCESS',
        requestPayload: JSON.stringify(payload),
        responsePayload: JSON.stringify(rpcResult.data),
        approvedBy: adjustment.approvedBy || 'System Admin',
        approvedAtUtc: adjustment.approvedAt || nowUtc,
        exportedAtUtc: nowUtc,
        retryCount: 0,
      };

      OdooErrorLogService.logExport(successRecord);

      return {
        success: true,
        exportRecord: successRecord,
      };
    } catch (err: any) {
      const failedRecord: OdooExportRecord = {
        id: `EXP-${Date.now()}`,
        tenant_id: adjustment.tenant_id,
        group_id: adjustment.group_id,
        legal_entity_id: adjustment.legal_entity_id,
        adjustmentId: adjustment.id,
        idempotencyKey,
        amount: adjustment.amount,
        currency: adjustment.transaction_currency || 'ETB',
        reconCategory: adjustment.category,
        status: 'FAILED',
        errorMessage: err.message || 'Network timeout calling Odoo ERP API',
        requestPayload: JSON.stringify(payload),
        approvedBy: adjustment.approvedBy || 'System Admin',
        approvedAtUtc: adjustment.approvedAt || new Date().toISOString(),
        retryCount: 0,
      };

      OdooErrorLogService.logExport(failedRecord);

      return {
        success: false,
        exportRecord: failedRecord,
        error: err.message || 'Odoo export failed',
      };
    }
  }

  /**
   * Retries a failed export from exception queue
   */
  static async retryFailedExport(
    exportRecordId: string,
    config: OdooConfig,
    adjustment: ManualAdjustment
  ): Promise<{ success: boolean; exportRecord: OdooExportRecord; error?: string }> {
    const records = OdooErrorLogService.getExportRecords();
    const existing = records.find((r) => r.id === exportRecordId);

    if (!existing) {
      throw new Error(`Export record ${exportRecordId} not found.`);
    }

    existing.retryCount += 1;
    OdooErrorLogService.logExport(existing);

    // Re-attempt export
    const result = await OdooJournalExportService.exportAdjustmentToOdoo(adjustment, config);
    if (result.success) {
      existing.status = 'SUCCESS';
      existing.odoo_reference = result.exportRecord.odoo_reference;
      existing.exportedAtUtc = new Date().toISOString();
      OdooErrorLogService.logExport(existing);
    }
    return result;
  }
}
