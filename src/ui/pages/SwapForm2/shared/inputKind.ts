import BigNumber from 'bignumber.js';

export type InputKind = 'token' | 'currency';

export function resolveTokenValue(
  rawValue: string,
  inputKind: InputKind,
  price: number | null
): string {
  if (inputKind === 'token' || !price) {
    return rawValue;
  }
  const bn = new BigNumber(rawValue);
  if (bn.isNaN()) return rawValue;
  return bn.dividedBy(price).toFixed();
}

export function convertOnToggle(
  rawValue: string,
  fromKind: InputKind,
  toKind: InputKind,
  price: number | null
): string {
  if (fromKind === toKind || !price || !rawValue) return rawValue;
  const bn = new BigNumber(rawValue);
  if (bn.isNaN() || bn.isZero()) return rawValue;
  if (fromKind === 'token' && toKind === 'currency') {
    return bn
      .multipliedBy(price)
      .decimalPlaces(2, BigNumber.ROUND_HALF_UP)
      .toFixed();
  }
  if (fromKind === 'currency' && toKind === 'token') {
    const tokenValue = bn.dividedBy(price);
    const abs = tokenValue.abs();
    if (abs.gte(1000)) {
      return tokenValue.decimalPlaces(0, BigNumber.ROUND_DOWN).toFixed();
    }
    if (abs.gte(1)) {
      return tokenValue.decimalPlaces(3, BigNumber.ROUND_HALF_UP).toFixed();
    }
    return tokenValue.precision(3, BigNumber.ROUND_HALF_UP).toFixed();
  }
  return rawValue;
}
