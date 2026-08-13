import { describe, it, expect } from 'vitest';
import { OrgTerminology } from '../types';

describe('Configurable Organization Terminology', () => {
  it('supports Ethiopian telecom distributor terminology', () => {
    const ethiopiaTerms: OrgTerminology = {
      branchLabel: 'Shop',
      agentLabel: 'DSA',
      floatSourceLabel: 'UM / DD Float',
      mobileMoneyLabel: 'M-PESA / Telebirr',
      currencyLabel: 'ETB',
    };

    expect(ethiopiaTerms.branchLabel).toBe('Shop');
    expect(ethiopiaTerms.agentLabel).toBe('DSA');
    expect(ethiopiaTerms.currencyLabel).toBe('ETB');
  });

  it('supports Kenya retail / agent network terminology', () => {
    const kenyaTerms: OrgTerminology = {
      branchLabel: 'Branch',
      agentLabel: 'Cashier',
      floatSourceLabel: 'Wallet Float',
      mobileMoneyLabel: 'M-PESA Paybill',
      currencyLabel: 'KES',
    };

    expect(kenyaTerms.branchLabel).toBe('Branch');
    expect(kenyaTerms.agentLabel).toBe('Cashier');
    expect(kenyaTerms.currencyLabel).toBe('KES');
  });
});
