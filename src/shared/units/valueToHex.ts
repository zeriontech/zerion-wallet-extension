import type { BigNumberish } from '@ethersproject/bignumber';
import { BigNumber } from '@ethersproject/bignumber';
import { hexValue, isHexString } from '@ethersproject/bytes';

export function valueToHex(
  value: BigNumberish,
  transformEmptyString = false
): string {
  if (isHexString(value)) {
    return value as string;
  } else if (value === '') {
    return transformEmptyString ? '0x' : '';
  } else if (typeof value === 'string' || BigNumber.isBigNumber(value)) {
    // cases: "123" and { "_hex": "0x06a11e3d", "_isBigNumber": true }
    return hexValue(BigNumber.from(value));
  } else {
    return hexValue(value);
  }
}
