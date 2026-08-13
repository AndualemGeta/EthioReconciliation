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

describe('Odoo Export Idempotency Guard', () => {
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

  it('prevents duplicate Odoo journal entry creation when exported twice', async () => {
    const approvedAdj: ManualAdjustment = {
      id: 'ADJ-IDEM-001',
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
      external_reference: 'ADJ-IDEM-001',
      created_at_utc: '2026-08-01T00:00:00Z',
      updated_at_utc: '2026-08-01T00:00:00Z',
      companyId: 'LE-ETH-01',
      regionId: 'REG-ADD',
      shopId: 'SHP-BOL',
      floatSource: 'UM',
      amount: 1200,
      adjustmentType: 'CREDIT',
      category: 'COMMISSION_CORRECTION',
      reason: 'Commission bonus adjustment',
      createdBy: 'Officer A',
      createdAt: '2026-08-01T00:00:00Z',
      status: 'APPROVED',
      approvedBy: 'Finance Manager B',
      approvedAt: '2026-08-01T01:00:00Z',
    };

    // First Export Call
    const res1 = await OdooJournalExportService.exportAdjustmentToOdoo(approvedAdj, dummyConfig);
    expect(res1.success).toBe(true);
    const firstOdooRef = res1.exportRecord.odoo_reference;

    // Second Export Call with exact same idempotency key
    const res2 = await OdooJournalExportService.exportAdjustmentToOdoo(approvedAdj, dummyConfig);
    expect(res2.success).toBe(true);
    expect(res2.exportRecord.odoo_reference).toBe(firstOdooRef); // Idempotent match!
    expect(res2.error).toContain('Idempotency guard');
  });
});
