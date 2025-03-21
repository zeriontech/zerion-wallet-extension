import bs58 from 'bs58';

export function isSolanaAddress(address: string) {
  try {
    return bs58.decode(address).length === 32;
  } catch {
    return false;
  }
}

function isByteArrayPrivateKey(key: unknown): key is number[] {
  // Check if it's an array with 64 elements and each element is a valid byte (0-255)
  return (
    Array.isArray(key) &&
    key.length === 64 &&
    key.every((byte) => byte >= 0 && byte <= 255)
  );
}

export function isSolanaPrivateKey(value: string) {
  try {
    return bs58.decode(value).length === 64;
  } catch {
    return false;
  }
}

/**
 * Solana private key can be a string ('3HcVUQSw...')
 * or a UintArray ([114, 92, 6, 212, 216, ...])
 * and the UintArray can come from a user in a string format ('[114, 92, 6, 212, 216, ...]')
 * This function normalizes the value by converting it to an encoded string format ('3HcVUQSw...')
 * if possible, else it returns the original value untouched
 */
export function maybeNormalizeSolanaPrivateKey(value: string): string {
  if (isSolanaPrivateKey(value)) {
    return value;
  } else {
    try {
      const arr = JSON.parse(value) as unknown;
      if (isByteArrayPrivateKey(arr)) {
        return bs58.encode(arr);
      } else {
        return value; // not a byte-array private key, return untouched original
      }
    } catch {
      return value; // not a byte-array private key, return untouched original
    }
  }
}
