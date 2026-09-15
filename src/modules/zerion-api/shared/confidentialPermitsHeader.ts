import type { SignedPermit } from '../requests/wallet-prepare-permits';

export const CONFIDENTIAL_PERMITS_HEADER = 'Zerion-Confidential-Permits';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

/**
 * Encodes Signed Permits for the `Zerion-Confidential-Permits` header: the
 * compact JSON array (always an array, even for one permit) as unpadded
 * base64url (RFC 4648 §5). `contracts` / `expireAt` are echoed verbatim.
 */
export function encodeConfidentialPermitsHeader(
  permits: SignedPermit[]
): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(permits)));
}

/**
 * Header entry for GET endpoints that take permits (get-simple-positions).
 * No permits → no header: omitted, empty and `[]` all mean "no permits" to
 * the backend, and omitting keeps the request identical to today's.
 */
export function getConfidentialPermitsHeaders(
  permits: SignedPermit[] | undefined
): Record<string, string> {
  return permits?.length
    ? {
        [CONFIDENTIAL_PERMITS_HEADER]: encodeConfidentialPermitsHeader(permits),
      }
    : {};
}
