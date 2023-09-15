import { BigNumber } from 'bignumber.js';

export function toNumber(value: BigNumber.Value) {
  return value instanceof BigNumber ? value.toNumber() : Number(value);
}
