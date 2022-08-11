import { BigNumber } from 'bignumber.js';

export function baseToCommon(value: BigNumber.Value, decimalPlaces: number) {
  return new BigNumber(value).shiftedBy(0 - decimalPlaces);
}

export function commonToBase(value: BigNumber.Value, decimalPlaces: number) {
  return new BigNumber(value).shiftedBy(decimalPlaces);
}
