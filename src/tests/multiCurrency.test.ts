import { describe, it, expect } from 'vitest';
import { DecimalMoney } from '../utils/currency';

describe('Decimal-Safe Monetary Arithmetic & Multi-Currency', () => {
  it('prevents JavaScript floating-point representation bugs (e.g. 0.1 + 0.2 = 0.3)', () => {
    const jsRawSum = 0.1 + 0.2;
    expect(jsRawSum).not.toBe(0.3); // Proves the JS bug exists natively

    const safeSum = DecimalMoney.add(0.1, 0.2);
    expect(safeSum).toBe(0.3); // DecimalMoney handles it safely
  });

  it('correctly calculates multi-item sums decimal-safely', () => {
    const sum = DecimalMoney.add(100.05, 200.1, 0.05);
    expect(sum).toBe(300.2);
  });

  it('correctly subtracts money without precision loss', () => {
    const result = DecimalMoney.sub(150000.0, 149999.95);
    expect(result).toBe(0.05);
  });

  it('converts transaction currency to base currency using exchange rate', () => {
    const usdAmount = 1000;
    const usdToEtbRate = 125.5;

    const conversion = DecimalMoney.convertCurrency(usdAmount, usdToEtbRate);
    expect(conversion.convertedAmount).toBe(125500);
    expect(conversion.rateUsed).toBe(125.5);
  });

  it('formats currency correctly with ISO code', () => {
    const formatted = DecimalMoney.format(125500.5, 'ETB');
    expect(formatted).toContain('ETB');
    expect(formatted).toContain('125,500.50');
  });
});
