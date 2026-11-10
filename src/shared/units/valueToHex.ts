import { isHexString } from 'ethers';
import type { BigNumberish } from 'ethers';

/** Shape of the BigNumber values persisted by ethers v5. */
export interface EthersV5BigNumber {
  _hex: string;
  _isBigNumber: true;
}

export function isEthersV5BigNumber(value: unknown): value is EthersV5BigNumber {
  return (
    value !== null &&
    typeof value === 'object' &&
    '_isBigNumber' in value &&
    value._isBigNumber === true &&
    '_hex' in value &&
    typeof value._hex === 'string'
  );
}

/**
 * Minimal equivalent of ethers v5 `hexValue`: no leading zero padding.
 * Keeping this local avoids the v5 bytes/bignumber packages while preserving
 * the exact serialization used by persisted chain IDs and transactions.
 */
function hexValue(value: bigint | number): string {
  const bigint = BigInt(value);
  return bigint < 0n ? `-0x${(-bigint).toString(16)}` : `0x${bigint.toString(16)}`;
}

export function valueToHex(
  value: BigNumberish | EthersV5BigNumber,
  transformEmptyString = false,
): string {
  if (typeof value === 'string' && isHexString(value)) {
    return value;
  } else if (value === '') {
    return transformEmptyString ? '0x' : '';
  } else if (typeof value === 'string') {
    return hexValue(BigInt(value));
  } else if (isEthersV5BigNumber(value)) {
    return hexValue(BigInt(value._hex));
  } else if (typeof value === 'bigint' || typeof value === 'number') {
    return hexValue(value);
  } else {
    throw new TypeError('Unsupported valueToHex input');
  }
}
