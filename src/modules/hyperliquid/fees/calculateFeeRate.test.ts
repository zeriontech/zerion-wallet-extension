import {
  BUILDER_FEE_DENOMINATOR,
  builderFeeUnitToMaxFeeRateString,
  builderFeeUnitToRate,
  calculateFeeBreakdown,
} from './calculateFeeRate';

// Hyperliquid denominates builder-fee units in *tenths of a basis point*:
// `1` unit = 0.001% = 0.00001 as a fraction. The remote config's
// self-consistent pair maxApproveBuilderFee "0.1%" ↔ maxApproveBuilderFeeInteger
// 100 fixes the denominator at 100_000. A wrong denominator (e.g. 1e6) makes
// the approved `maxFeeRate` 10× smaller than the order's `f` charges, and
// Hyperliquid rejects orders with "Builder fee has not been approved."
describe('builder-fee unit conversion', () => {
  test('denominator matches Hyperliquid tenths-of-bps', () => {
    expect(BUILDER_FEE_DENOMINATOR).toBe(100_000);
  });

  test('builderFeeUnitToMaxFeeRateString: config cap 100 → "0.1%"', () => {
    expect(builderFeeUnitToMaxFeeRateString(100)).toBe('0.1%');
  });

  test('builderFeeUnitToMaxFeeRateString: standard fee 40 → "0.04%"', () => {
    expect(builderFeeUnitToMaxFeeRateString(40)).toBe('0.04%');
  });

  test('builderFeeUnitToMaxFeeRateString: premium fee 20 → "0.02%"', () => {
    expect(builderFeeUnitToMaxFeeRateString(20)).toBe('0.02%');
  });

  test('builderFeeUnitToRate: 40 units → 0.0004 fraction (0.04%)', () => {
    expect(builderFeeUnitToRate(40)).toBeCloseTo(0.0004, 10);
  });

  test('approved max (100) covers the per-order fee (40)', () => {
    // The whole point of approving the fixed cap: its rate must be >= the
    // order fee's rate so Hyperliquid accepts the order.
    expect(builderFeeUnitToRate(100)).toBeGreaterThanOrEqual(
      builderFeeUnitToRate(40)
    );
  });
});

describe('calculateFeeBreakdown', () => {
  test('adds hyperliquid (post-discount) and builder rates', () => {
    const breakdown = calculateFeeBreakdown({
      userCrossRate: 0.0005,
      referralDiscount: 0.1,
      builderFeeUnits: 40,
    });
    expect(breakdown.hyperliquidRate).toBeCloseTo(0.00045, 10); // 0.0005 * 0.9
    expect(breakdown.zerionRate).toBeCloseTo(0.0004, 10); // 40 tenths-of-bps
    expect(breakdown.totalRate).toBeCloseTo(0.00085, 10);
  });
});
