import { isLegacyBigNumber, legacyBigNumberToHex, type LegacyBigNumber } from './legacyBigNumber';

const HEX_STRING = /^0x[0-9A-Fa-f]*$/;
const DECIMAL_STRING = /^-?[0-9]+$/;
const NEGATIVE_HEX_STRING = /^-0x[0-9A-Fa-f]+$/;

function unsignedBigIntToString(value: bigint, original: bigint | string): string {
  if (value < 0n) {
    throw new Error(`valueToHex: negative value: ${original}`);
  }
  return `0x${value.toString(16)}`;
}

/** A Uint8Array or a plain array whose items are all bytes */
function isByteArray(value: unknown): value is Uint8Array | number[] {
  if (value instanceof Uint8Array) {
    return true;
  }
  return (
    Array.isArray(value) &&
    value.every(
      (byte: unknown) =>
        typeof byte === 'number' && Number.isInteger(byte) && byte >= 0 && byte < 256,
    )
  );
}

/** Big-endian bytes as minimal hex, the way ethers v5 hexlified them */
function bytesToHex(value: Uint8Array | number[]): string {
  let result = 0n;
  for (let i = 0; i < value.length; i++) {
    result = (result << 8n) | BigInt(value[i]);
  }
  return `0x${result.toString(16)}`;
}

export function valueToHex(
  value: string | number | bigint | LegacyBigNumber,
  transformEmptyString = false,
): string {
  if (typeof value === 'string' && HEX_STRING.test(value)) {
    return value;
  } else if (value === '') {
    return transformEmptyString ? '0x' : '';
  } else if (isLegacyBigNumber(value)) {
    return legacyBigNumberToHex(value);
  } else if (typeof value === 'string') {
    if (NEGATIVE_HEX_STRING.test(value)) {
      // ethers v5 parsed '-0x…' strings, but rejected the negative result
      if (BigInt(value) === 0n) {
        return '0x0';
      }
      throw new Error(`valueToHex: negative value: ${value}`);
    }
    if (!DECIMAL_STRING.test(value)) {
      throw new Error(`valueToHex: not an unsigned integer: ${value}`);
    }
    return unsignedBigIntToString(BigInt(value), value);
  } else if (typeof value === 'bigint') {
    return unsignedBigIntToString(value, value);
  } else if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      // ethers v5 returned '0x0' here; NonceLine passes Number(userInput)
      return '0x0';
    }
    // ethers v5 rejected values from 2^53 - 1 up, but let NaN and -0 through
    if (!(Number.isInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER)) {
      throw new Error(`valueToHex: not a safe unsigned integer: ${value}`);
    }
    return `0x${value.toString(16)}`;
  } else if (isByteArray(value)) {
    return bytesToHex(value);
  }
  throw new Error(`valueToHex: unsupported value: ${String(value)}`);
}
