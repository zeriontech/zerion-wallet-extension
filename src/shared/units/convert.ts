import { BigNumber } from 'bignumber.js';

const HEX_STRING_PATTERN = /^0x[0-9a-f]+$/i;

/**
 * bignumber.js parses all-uppercase or all-lowercase 0x-hex strings, but
 * returns NaN for mixed-case hex (e.g. `new BigNumber('0xFf')` -> NaN).
 * EIP-712 uint256 fields (e.g. a Permit `value`) can legitimately arrive as
 * mixed-case hex, so normalize any 0x-prefixed hex string to a decimal string
 * via BigInt (which parses hex case-insensitively) before handing it to
 * bignumber.js.
 */
export function normalizeNumberValue(value: BigNumber.Value): BigNumber.Value {
  if (typeof value === 'string' && HEX_STRING_PATTERN.test(value)) {
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
