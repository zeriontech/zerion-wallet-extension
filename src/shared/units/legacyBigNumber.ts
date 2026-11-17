/**
 * A number as ethers v5 serialised it into browser storage. Old transaction
 * records still contain this shape, so it has to stay readable.
 */
export interface LegacyBigNumber {
  _hex: unknown;
  _isBigNumber: unknown;
}

/** The `_hex` a number passed to ethers v5 had to be: a hex string, optionally negative */
const STORED_HEX = /^-?0x[0-9A-Fa-f]+$/;
const HEX_STRING = /^-?0x[0-9a-f]+$/i;
const DECIMAL_STRING = /^-?[0-9]+$/;

export function isLegacyBigNumber(value: unknown): value is LegacyBigNumber {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_isBigNumber' in value &&
    Boolean(value._isBigNumber)
  );
}

/** `toHex` from ethers v5 bignumber: normalise sign, prefix, length and zero bytes */
function toEvenHex(hex: string): string {
  if (hex[0] === '-') {
    const positive = toEvenHex(hex.substring(1));
    return positive === '0x00' ? positive : `-${positive}`;
  }
  let normalized = hex.substring(0, 2) === '0x' ? hex : `0x${hex}`;
  if (normalized === '0x') {
    normalized = '0x00';
  }
  if (normalized.length % 2) {
    normalized = `0x0${normalized.substring(2)}`;
  }
  while (normalized.length > 4 && normalized.substring(0, 4) === '0x00') {
    normalized = `0x${normalized.substring(4)}`;
  }
  return normalized;
}

/** `BigNumber.from(value).toHexString()` for a `BigNumberish` string input */
function stringToStoredHex(value: string): string {
  if (HEX_STRING.test(value)) {
    return toEvenHex(value);
  }
  if (DECIMAL_STRING.test(value)) {
    return toEvenHex(BigInt(value).toString(16));
  }
  throw new Error(`legacyBigNumber: invalid BigNumber string: ${value}`);
}

/**
 * What ethers v5 `BigNumber.from(value).toHexString()` returned: lower-case
 * `0x` prefix, an even number of hex digits, no leading zero bytes, `0x00` for
 * zero, and a `-` sign for negative values. Digit case is preserved.
 */
export function legacyBigNumberToStoredHex(value: LegacyBigNumber): string {
  const hex = value._hex;
  if (typeof hex !== 'string' || !STORED_HEX.test(hex)) {
    throw new Error(`legacyBigNumber: not a hex string: ${String(hex)}`);
  }
  return toEvenHex(hex);
}

/**
 * What `valueToHex` returned for a stored number: minimal hex, leading zeros
 * stripped, `0x0` for zero. ethers v5 rejected negative values here.
 */
export function legacyBigNumberToHex(value: LegacyBigNumber): string {
  const hex = legacyBigNumberToStoredHex(value);
  if (hex[0] === '-') {
    throw new Error(`legacyBigNumber: negative value: ${hex}`);
  }
  const digits = hex.substring(2).replace(/^0+/, '');
  return digits === '' ? '0x0' : `0x${digits}`;
}

/** A chain id as ethers v5 stored it, from the `0x…` string the app keeps */
export function toLegacyBigNumber(value: string): LegacyBigNumber {
  return { _hex: stringToStoredHex(value), _isBigNumber: true };
}
