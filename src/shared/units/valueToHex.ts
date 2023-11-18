import type { BigNumberish } from '@ethersproject/bignumber';
import { BigNumber } from '@ethersproject/bignumber';
import { hexValue, isHexString } from '@ethersproject/bytes';

export function valueToHex(value: BigNumberish): string {
  if (isHexString(value)) {
    return value as string;
  } else if (typeof value === 'string') {
    return hexValue(BigNumber.from(value));
  } else {
    return hexValue(value);
  }
}
