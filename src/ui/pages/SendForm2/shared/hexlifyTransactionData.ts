import { hexlify, isHexString, toUtf8Bytes } from 'ethers';

/**
 * Normalize user-entered transaction data to a hex string for the backend.
 * A `0x`-prefixed hex string is passed through unchanged (used as raw bytes);
 * anything else is treated as a UTF-8 message and encoded to hex. Mirrors the
 * wallet's message-signing convention (`hexlify(toUtf8Bytes(...))`).
 */
export function hexlifyTransactionData(value: string): string {
  return isHexString(value) ? value : hexlify(toUtf8Bytes(value));
}
