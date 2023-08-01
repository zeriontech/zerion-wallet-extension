import { BigNumber } from 'bignumber.js';
import type { BigNumberish } from 'ethers';

export function toNumber(value?: BigNumber.Value | BigNumberish) {
  return !value
    ? 0
    : value instanceof BigNumber
    ? value.toNumber()
    : typeof value === 'object' && '_hex' in value
    ? Number(value._hex)
    : Number(value);
}
