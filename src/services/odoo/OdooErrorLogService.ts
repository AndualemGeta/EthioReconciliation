import { OdooExportRecord, OdooSyncLog } from '../../types';

const STORAGE_KEYS = {
  EXPORT_RECORDS: 'reconflow_odoo_export_records',
  SYNC_LOGS: 'reconflow_odoo_sync_logs',
};

export class OdooErrorLogService {
  static getExportRecords(): OdooExportRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPORT_RECORDS);
    if (!raw) return OdooErrorLogService.getInitialExportRecords();
    return JSON.parse(raw);
  }

  static saveExportRecords(records: OdooExportRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPORT_RECORDS, JSON.stringify(records));
  }

  static logExport(record: OdooExportRecord): void {
    const records = OdooErrorLogService.getExportRecords();
    const existingIndex = records.findIndex((r) => r.id === record.id);
    if (existingIndex !== -1) {
      records[existingIndex] = record;
    } else {
      records.unshift(record);
    }
    OdooErrorLogService.saveExportRecords(records);
  }

  static getSyncLogs(): OdooSyncLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
    if (!raw) return OdooErrorLogService.getInitialSyncLogs();
    return JSON.parse(raw);
  }

  static saveSyncLogs(logs: OdooSyncLog[]): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(logs));
  }

  static logSync(log: OdooSyncLog): void {
    const logs = OdooErrorLogService.getSyncLogs();
    logs.unshift(log);
    OdooErrorLogService.saveSyncLogs(logs);
  }

  static getFailedExports(): OdooExportRecord[] {
    return OdooErrorLogService.getExportRecords().filter((r) => r.status === 'FAILED');
  }

  private static getInitialExportRecords(): OdooExportRecord[] {
    return [
      {
        id: 'EXP-1001',
        tenant_id: 'TNT-GLOBAL-01',
        group_id: 'GRP-AFRICA-01',
        legal_entity_id: 'LE-ETH-01',
        adjustmentId: 'ADJ-1002',
        idempotencyKey: 'IDEM-ADJ-1002-20260807',
        odoo_reference: 'MISC/2026/08/0012',
        journalEntryId: '40921',
        amount: 450,
        currency: 'ETB',
        reconCategory: 'BANK_FEE',
        status: 'SUCCESS',
        requestPayload: JSON.stringify({
          journal_id: 3,
          date: '2026-08-07',
          ref: 'ReconFlow ADJ-1002 - Bank Fee Deduction',
          line_ids: [
            [0, 0, { account_id: 600100, credit: 0, debit: 450, name: 'Bank Fee' }],
            [0, 0, { account_id: 101000, credit: 450, debit: 0, name: 'Awash Bank Cash' }],
          ],
        }),
        responsePayload: JSON.stringify({ id: 40921, name: 'MISC/2026/08/0012', state: 'posted' }),
        approvedBy: 'Finance Manager (Kassahun)',
        approvedAtUtc: '2026-08-07T15:30:00Z',
        exportedAtUtc: '2026-08-07T15:31:00Z',
        retryCount: 0,
      },
      {
        id: 'EXP-1002',
        tenant_id: 'TNT-GLOBAL-01',
        group_id: 'GRP-AFRICA-01',
        legal_entity_id: 'LE-ETH-01',
        adjustmentId: 'ADJ-1005-SHORTAGE',
        idempotencyKey: 'IDEM-ADJ-1005-20260808',
        amount: 15000,
        currency: 'ETB',
        reconCategory: 'SHORTAGE_WRITE_OFF',
        status: 'FAILED',
        errorMessage: 'Odoo API Error 400: Account 600500 Shortage Expense requires Analytic Account tag for Oromia Hub.',
        requestPayload: JSON.stringify({
          journal_id: 3,
          date: '2026-08-08',
          ref: 'ReconFlow EXC-1001 Shortage Write-off',
          line_ids: [
            [0, 0, { account_id: 600500, credit: 0, debit: 15000 }],
            [0, 0, { account_id: 101000, credit: 15000, debit: 0 }],
          ],
        }),
        responsePayload: JSON.stringify({ error: 'Missing analytic dimension' }),
        approvedBy: 'Finance Manager (Kassahun)',
        approvedAtUtc: '2026-08-08T10:00:00Z',
        retryCount: 1,
      },
    ];
  }

  private static getInitialSyncLogs(): OdooSyncLog[] {
    return [
      {
        id: 'SYNC-LOG-01',
        tenant_id: 'TNT-GLOBAL-01',
        group_id: 'GRP-AFRICA-01',
        legal_entity_id: 'LE-ETH-01',
        entityType: 'CHART_OF_ACCOUNTS',
        direction: 'INBOUND',
        recordsProcessed: 142,
        status: 'SUCCESS',
        details: 'Imported Chart of Accounts from Odoo company EthioConnect PLC.',
        timestampUtc: '2026-08-11T04:00:00Z',
      },
      {
        id: 'SYNC-LOG-02',
        tenant_id: 'TNT-GLOBAL-01',
        group_id: 'GRP-AFRICA-01',
        legal_entity_id: 'LE-ETH-01',
        entityType: 'JOURNALS',
        direction: 'INBOUND',
        recordsProcessed: 8,
        status: 'SUCCESS',
        details: 'Synchronized Cash, Bank, and Miscellaneous journals.',
        timestampUtc: '2026-08-11T04:05:00Z',
      },
    ];
  }
}
