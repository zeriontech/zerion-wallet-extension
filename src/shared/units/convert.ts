import { BigNumber } from 'bignumber.js';
import { isHexString } from 'ethers';

/**
 * bignumber.js parses all-uppercase or all-lowercase 0x-hex strings, but
 * returns NaN for mixed-case hex (e.g. `new BigNumber('0xFf')` -> NaN).
 * EIP-712 uint256 fields (e.g. a Permit `value`) can legitimately arrive as
 * mixed-case hex, so normalize any 0x-prefixed hex string to a decimal string
 * via BigInt (which parses hex case-insensitively) before handing it to
 * bignumber.js.
 */
export function normalizeNumberValue(value: BigNumber.Value): BigNumber.Value {
  // isHexString also returns true for a bare '0x', which BigInt can't parse,
  // so require at least one hex digit.
  if (isHexString(value) && value.length > 2) {
    return BigInt(value).toString();
  }
  return value;
}

export function baseToCommon(value: BigNumber.Value, decimalPlaces: number) {
  return new BigNumber(normalizeNumberValue(value)).shiftedBy(
    0 - decimalPlaces
  );
}

export function commonToBase(value: BigNumber.Value, decimalPlaces: number) {
  return new BigNumber(normalizeNumberValue(value)).shiftedBy(decimalPlaces);
}
