import BigNumber from 'bignumber.js';

export function roundTokenDisplayValue(value: string | null): string | null {
  if (value == null || value === '') return value;
  const bn = new BigNumber(value);
  if (bn.isNaN()) return value;
  if (bn.isZero()) return '0';
  const abs = bn.abs();
  if (abs.gte(1000)) {
    return bn.decimalPlaces(0, BigNumber.ROUND_DOWN).toFixed();
  }
  if (abs.gte(1)) {
    return bn.decimalPlaces(3, BigNumber.ROUND_HALF_UP).toFixed();
  }
  return bn.precision(3, BigNumber.ROUND_HALF_UP).toFixed();
}

export function roundCurrencyDisplayValue(value: string | null): string | null {
  if (value == null || value === '') return value;
  const bn = new BigNumber(value);
  if (bn.isNaN()) return value;
  if (bn.isZero()) return '0.00';
  if (bn.abs().lt(0.01)) {
    return bn.precision(2, BigNumber.ROUND_HALF_UP).toFixed();
  }
  return bn.decimalPlaces(2, BigNumber.ROUND_HALF_UP).toFixed();
}
