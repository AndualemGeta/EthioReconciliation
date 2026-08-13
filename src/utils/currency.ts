/**
 * Safe Decimal Arithmetic Utilities for Financial & Reconciliation Calculations
 * Avoids JavaScript floating-point representation bugs (e.g., 0.1 + 0.2 = 0.30000000000000004)
 */

// Precision multiplier (4 decimal places = micro-units / cents * 100)
const PRECISION_SCALE = 10000;

export class DecimalMoney {
  /**
   * Converts a float / number to scaled integer units
   */
  static toScaled(amount: number): bigint {
    if (isNaN(amount) || !isFinite(amount)) return 0n;
    // Rounding to 4 decimal places before converting to BigInt
    return BigInt(Math.round(amount * PRECISION_SCALE));
  }

  /**
   * Converts scaled BigInt back to standard float rounded to 2 decimal places
   */
  static fromScaled(scaled: bigint): number {
    const floatVal = Number(scaled) / PRECISION_SCALE;
    return Math.round(floatVal * 100) / 100;
  }

  /**
   * Adds numbers decimal-safely
   */
  static add(...amounts: number[]): number {
    let sum = 0n;
    for (const amt of amounts) {
      sum += DecimalMoney.toScaled(amt);
    }
    return DecimalMoney.fromScaled(sum);
  }

  /**
   * Subtracts numbers decimal-safely (a - b)
   */
  static sub(a: number, b: number): number {
    const scaledA = DecimalMoney.toScaled(a);
    const scaledB = DecimalMoney.toScaled(b);
    return DecimalMoney.fromScaled(scaledA - scaledB);
  }

  /**
   * Multiplies money by a factor or rate (e.g. exchange rate)
   */
  static multiply(amount: number, factor: number): number {
    const val = amount * factor;
    return Math.round(val * 100) / 100;
  }

  /**
   * Calculates currency conversion using exchange rate
   */
  static convertCurrency(
    amount: number,
    exchangeRate: number
  ): { convertedAmount: number; rateUsed: number } {
    const rate = exchangeRate > 0 ? exchangeRate : 1.0;
    const convertedAmount = DecimalMoney.multiply(amount, rate);
    return { convertedAmount, rateUsed: rate };
  }

  /**
   * Formats currency with ISO code
   */
  static format(
    amount: number,
    currencyCode: string = 'ETB',
    locale: string = 'en-US'
  ): string {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${currencyCode} ${formatted}`;
  }
}
