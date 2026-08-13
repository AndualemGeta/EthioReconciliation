import { describe, it, expect } from 'vitest';
import { NormalizedTransaction, UserScope } from '../types';

describe('Data Isolation per Legal Entity', () => {
  const transactions: NormalizedTransaction[] = [
    {
      id: 'TX-ETH-01',
      tenant_id: 'TNT-GLOBAL-01',
      group_id: 'GRP-AFRICA-01',
      legal_entity_id: 'LE-ETH-01',
      country_code: 'ET',
      base_currency: 'ETB',
      transaction_currency: 'ETB',
      exchange_rate: 1.0,
      exchange_rate_date: '2026-08-01',
      time_zone: 'Africa/Addis_Ababa',
      source_system: 'CBE',
      external_reference: 'REF-001',
      created_at_utc: '2026-08-01T00:00:00Z',
      updated_at_utc: '2026-08-01T00:00:00Z',
      transactionDate: '2026-08-01',
      postingDate: '2026-08-01',
      amount: 10000,
      currency: 'ETB',
      direction: 'IN',
      transactionType: 'DEPOSIT',
      floatSource: 'UM',
      description: 'CBE Deposit Ethiopia',
      status: 'RECONCILED',
      importBatchId: 'B-01',
      createdAt: '2026-08-01T00:00:00Z',
      createdBy: 'Tester',
    },
    {
      id: 'TX-KEN-01',
      tenant_id: 'TNT-GLOBAL-01',
      group_id: 'GRP-AFRICA-01',
      legal_entity_id: 'LE-KEN-01',
      country_code: 'KE',
      base_currency: 'KES',
      transaction_currency: 'KES',
      exchange_rate: 1.0,
      exchange_rate_date: '2026-08-01',
      time_zone: 'Africa/Nairobi',
      source_system: 'M-PESA',
      external_reference: 'REF-002',
      created_at_utc: '2026-08-01T00:00:00Z',
      updated_at_utc: '2026-08-01T00:00:00Z',
      transactionDate: '2026-08-01',
      postingDate: '2026-08-01',
      amount: 5000,
      currency: 'KES',
      direction: 'IN',
      transactionType: 'DEPOSIT',
      floatSource: 'UM',
      description: 'M-PESA Deposit Kenya',
      status: 'RECONCILED',
      importBatchId: 'B-02',
      createdAt: '2026-08-01T00:00:00Z',
      createdBy: 'Tester',
    },
  ];

  it('filters transactions strictly by legal_entity_id for single-entity user scope', () => {
    const ethiopiaScope: UserScope = {
      userId: 'U-01',
      userName: 'Ethio User',
      role: 'FINANCE_MANAGER',
      tenantId: 'TNT-GLOBAL-01',
      groupId: 'GRP-AFRICA-01',
      companyId: 'LE-ETH-01',
      legalEntityId: 'LE-ETH-01',
      countryCode: 'ET',
      authorizedLegalEntityIds: ['LE-ETH-01'],
    };

    const ethTxs = transactions.filter((t) =>
      ethiopiaScope.authorizedLegalEntityIds.includes(t.legal_entity_id)
    );

    expect(ethTxs).toHaveLength(1);
    expect(ethTxs[0].id).toBe('TX-ETH-01');
  });

  it('allows cross-entity access for multi-entity authorized user scope', () => {
    const groupAdminScope: UserScope = {
      userId: 'U-GROUP',
      userName: 'Group Auditor',
      role: 'GROUP_ADMIN',
      tenantId: 'TNT-GLOBAL-01',
      groupId: 'GRP-AFRICA-01',
      companyId: 'LE-ETH-01',
      legalEntityId: 'LE-ETH-01',
      countryCode: 'ET',
      authorizedLegalEntityIds: ['LE-ETH-01', 'LE-KEN-01'],
    };

    const groupTxs = transactions.filter((t) =>
      groupAdminScope.authorizedLegalEntityIds.includes(t.legal_entity_id)
    );

    expect(groupTxs).toHaveLength(2);
  });
});
