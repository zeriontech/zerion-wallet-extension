import { getEffectiveGasPrice } from './getEffectiveGasPrice';

describe('getEffectiveGasPrice', () => {
  test('legacy: returns gasPrice', () => {
    expect(getEffectiveGasPrice({ gasPrice: 20 }, null)).toBe(20);
    expect(getEffectiveGasPrice({ gasPrice: 20 }, 5)).toBe(20);
  });

  test('eip-1559: min(maxFee, baseFee + maxPriorityFee)', () => {
    // baseFee + priority = 110, below maxFee 200 → 110
    expect(getEffectiveGasPrice({ maxFee: 200, maxPriorityFee: 10 }, 100)).toBe(
      110
    );
    // baseFee + priority = 260, above maxFee 200 → capped at 200
    expect(getEffectiveGasPrice({ maxFee: 200, maxPriorityFee: 10 }, 250)).toBe(
      200
    );
  });

  test('eip-1559 without base fee falls back to maxFee', () => {
    expect(
      getEffectiveGasPrice({ maxFee: 200, maxPriorityFee: 10 }, null)
    ).toBe(200);
  });

  test('returns null when no price information', () => {
    expect(getEffectiveGasPrice({}, 100)).toBeNull();
    expect(
      getEffectiveGasPrice({ gasPrice: null, maxFee: null }, 100)
    ).toBeNull();
  });
});
