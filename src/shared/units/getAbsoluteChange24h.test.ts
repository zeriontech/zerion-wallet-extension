import { getAbsoluteChange24h } from './getAbsoluteChange24h';

describe('getAbsoluteChange24h', () => {
  test('uses the value 24h ago as the base for a gain', () => {
    // WLT-2656: CABO +165.2% on a $2,275 position was shown as +$3,759
    expect(getAbsoluteChange24h(2275, 1.652)).toBeCloseTo(1417.16, 1);
  });

  test('uses the value 24h ago as the base for a loss', () => {
    // 200 → 100 is −50%, a loss of 100
    expect(getAbsoluteChange24h(100, -0.5)).toBeCloseTo(-100);
  });

  test('returns zero for an unchanged price', () => {
    expect(getAbsoluteChange24h(2275, 0)).toBe(0);
  });

  test('returns the current value when the price went to zero', () => {
    expect(getAbsoluteChange24h(0, -1)).toBe(0);
  });
});
