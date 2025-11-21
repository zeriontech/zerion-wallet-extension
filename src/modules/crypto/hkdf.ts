import { utf8ToUint8Array } from './convert';

/**
 * HKDF (HMAC-based Key Derivation Function) implementation using Web Crypto API
 * RFC 5869: https://tools.ietf.org/html/rfc5869
 *
 * This provides a cryptographically secure way to derive keys from high-entropy input
 * (like PRF output) without the computational cost of PBKDF2.
 */

/**
 * Derives a key using HKDF-SHA256
 *
 * @param ikm - Input Key Material (the high-entropy source, e.g., PRF output)
 * @param salt - Salt value (should be random and unique per credential)
 * @param info - Optional context and application specific information
 * @param length - Desired output length in bytes (default: 32 for SHA-256)
 * @returns Derived key as hex string
 */
async function hkdf({
  ikm,
  salt,
  info,
  length = 32,
}: {
  ikm: string | ArrayBuffer;
  salt: string;
  info: string;
  length?: number;
}): Promise<string> {
  // Convert inputs to Uint8Array
  const ikmArray =
    typeof ikm === 'string' ? utf8ToUint8Array(ikm) : new Uint8Array(ikm);
  const saltArray = utf8ToUint8Array(salt);
  const infoArray = utf8ToUint8Array(info);

  // Import IKM as a CryptoKey for HKDF
  const ikmKey = await crypto.subtle.importKey(
    'raw',
    ikmArray,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive bits using HKDF
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltArray,
      info: infoArray,
    },
    ikmKey,
    length * 8 // Convert bytes to bits
  );

  // Convert to hex string for consistency with existing sha256 function
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Derives an encryption key from PRF output using HKDF
 * This adds defense-in-depth by ensuring even if the salt is compromised,
 * the attacker still needs the PRF output from the authenticator.
 *
 * @param prfOutput - The PRF output from WebAuthn authenticator
 * @param salt - Random salt (stored with the passkey)
 * @returns Encryption key as hex string
 */
export async function deriveEncryptionKeyFromPRF(
  prfOutput: ArrayBuffer,
  salt: string
): Promise<string> {
  return hkdf({
    ikm: prfOutput,
    salt,
    length: 32,
    info: 'zerion-passkey-v1',
  });
}
