import BigNumber from 'bignumber.js';
import { resolveInputAmount } from './inputKind';

const BALANCE = '50.0324';
const PRICE = 0.9995;
// 50.0324 × 0.9995 = 50.0073838, rounded up to cents by MAX in currency mode.
const MAX_DOLLARS = '50.01';

describe('resolveInputAmount', () => {
  it('uses the exact balance when MAX was applied in currency mode', () => {
    expect(
      resolveInputAmount({
        rawValue: MAX_DOLLARS,
        inputKind: 'currency',
        price: PRICE,
        balance: BALANCE,
        isMax: true,
      }),
    ).toBe(BALANCE);
  });

  it('resolves manually entered dollars through the price', () => {
    const resolved = resolveInputAmount({
      rawValue: MAX_DOLLARS,
      inputKind: 'currency',
      price: PRICE,
      balance: BALANCE,
      isMax: false,
    });
    expect(new BigNumber(resolved).isGreaterThan(BALANCE)).toBe(true);
  });

  it('returns the typed token amount unchanged in token mode', () => {
    expect(
      resolveInputAmount({
        rawValue: '1.5',
        inputKind: 'token',
        price: PRICE,
        balance: BALANCE,
        isMax: false,
      }),
    ).toBe('1.5');
  });

  it('returns the raw value when the price is unknown', () => {
    expect(
      resolveInputAmount({
        rawValue: MAX_DOLLARS,
        inputKind: 'currency',
        price: null,
        balance: BALANCE,
        isMax: false,
      }),
    ).toBe(MAX_DOLLARS);
  });

  it('returns an empty value unchanged', () => {
    expect(
      resolveInputAmount({
        rawValue: '',
        inputKind: 'currency',
        price: PRICE,
        balance: BALANCE,
        isMax: true,
      }),
    ).toBe('');
  });
});
