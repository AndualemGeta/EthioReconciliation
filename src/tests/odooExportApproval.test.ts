import { describe, it, expect, beforeEach } from 'vitest';
import { ManualAdjustment, OdooConfig } from '../types';
import { OdooJournalExportService } from '../services/odoo/OdooJournalExportService';

if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    length: 0,
    key: (i: number) => Object.keys(store)[i] || null,
  };
}

describe('Odoo Export Approval Rule (Maker-Checker Enforcer)', () => {
  const dummyConfig: OdooConfig = {
    id: 'CFG-TEST',
    tenantId: 'TNT-GLOBAL-01',
    groupId: 'GRP-AFRICA-01',
    legalEntityId: 'LE-ETH-01',
    connectionName: 'Test Odoo',
    instanceUrl: 'https://test.odoo.com',
    databaseName: 'test_db',
    authMethod: 'API_KEY',
    username: 'service_user',
    passwordOrApiKey: 'test_key',
    odooCompanyId: 1,
    odooCompanyName: 'Test Co',
    defaultBankJournalId: '1',
    defaultCashJournalId: '2',
    defaultShortageAccountId: '600500',
    defaultCommissionAccountId: '400200',
    defaultBankFeeAccountId: '600100',
    syncFrequency: 'MANUAL',
    isEnabled: true,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('rejects export if adjustment status is PENDING_APPROVAL', async () => {
    const unapprovedAdj: ManualAdjustment = {
      id: 'ADJ-UNAPPROVED-1',
      tenant_id: 'TNT-GLOBAL-01',
      group_id: 'GRP-AFRICA-01',
      legal_entity_id: 'LE-ETH-01',
      country_code: 'ET',
      base_currency: 'ETB',
      transaction_currency: 'ETB',
      exchange_rate: 1.0,
      exchange_rate_date: '2026-08-01',
      time_zone: 'Africa/Addis_Ababa',
      source_system: 'ReconFlow',
      external_reference: 'ADJ-UNAPPROVED-1',
      created_at_utc: '2026-08-01T00:00:00Z',
      updated_at_utc: '2026-08-01T00:00:00Z',
      companyId: 'LE-ETH-01',
      regionId: 'REG-ADD',
      shopId: 'SHP-BOL',
      floatSource: 'UM',
      amount: 5000,
      adjustmentType: 'DEBIT',
      category: 'SHORTAGE_WRITE_OFF',
      reason: 'Unapproved shortage write-off',
      createdBy: 'Officer A',
      createdAt: '2026-08-01T00:00:00Z',
      status: 'PENDING_APPROVAL', // Not approved!
    };

    const res = await OdooJournalExportService.exportAdjustmentToOdoo(unapprovedAdj, dummyConfig);

    expect(res.success).toBe(false);
    expect(res.exportRecord.status).toBe('FAILED');
    expect(res.error).toContain('Maker-Checker approval');
  });

  it('allows export when adjustment status is APPROVED', async () => {
    const approvedAdj: ManualAdjustment = {
      id: 'ADJ-APPROVED-1',
      tenant_id: 'TNT-GLOBAL-01',
      group_id: 'GRP-AFRICA-01',
      legal_entity_id: 'LE-ETH-01',
      country_code: 'ET',
      base_currency: 'ETB',
      transaction_currency: 'ETB',
      exchange_rate: 1.0,
      exchange_rate_date: '2026-08-01',
      time_zone: 'Africa/Addis_Ababa',
      source_system: 'ReconFlow',
      external_reference: 'ADJ-APPROVED-1',
      created_at_utc: '2026-08-01T00:00:00Z',
      updated_at_utc: '2026-08-01T00:00:00Z',
      companyId: 'LE-ETH-01',
      regionId: 'REG-ADD',
      shopId: 'SHP-BOL',
      floatSource: 'UM',
      amount: 5000,
      adjustmentType: 'DEBIT',
      category: 'SHORTAGE_WRITE_OFF',
      reason: 'Approved shortage write-off',
      createdBy: 'Officer A',
      createdAt: '2026-08-01T00:00:00Z',
      status: 'APPROVED',
      approvedBy: 'Finance Manager B',
      approvedAt: '2026-08-01T01:00:00Z',
    };

    const res = await OdooJournalExportService.exportAdjustmentToOdoo(approvedAdj, dummyConfig);

    expect(res.success).toBe(true);
    expect(res.exportRecord.status).toBe('SUCCESS');
    expect(res.exportRecord.odoo_reference).toBeDefined();
  });
});
