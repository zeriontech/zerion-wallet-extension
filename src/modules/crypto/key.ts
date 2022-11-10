import { utf8ToUint8Array, base64ToUint8Array } from './convert';
import { getRandomBase64 } from './random';

/**
 * Creates a salt for use in CryptoKey generation.
 */
export function createSalt() {
  return getRandomBase64(32);
}

/**
 * Creates a new CryptoKey.
 *
 * @param password - The password, UTF-8 string.
 * @param salt - The salt, Base64 string.
 */
export async function createCryptoKey(
  password: string,
  salt: string
): Promise<CryptoKey> {
  const masterKey = await createMasterKey(password);
  const secretKey = await createSecretKey(masterKey, salt);

  return secretKey;
}

/**
 * Creates a new master key for a given password.
 */
async function createMasterKey(password: string): Promise<CryptoKey> {
  const passArray = utf8ToUint8Array(password);
  // For the PBKDF2 algorithm the baseKey is password.
  return await window.crypto.subtle.importKey(
    'raw',
    passArray,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
}

/**
 * Creates a secret key from a master key.
 *
 * @param masterKey A master key to derive from.
 * @param salt - The salt, Base64 string.
 */
async function createSecretKey(
  masterKey: CryptoKey,
  salt: string
): Promise<CryptoKey> {
  const saltArray = base64ToUint8Array(salt);

  // In 2021, OWASP recommended to use 310000 iterations for
  // PBKDF2-HMAC-SHA256 and 120000 for PBKDF2-HMAC-SHA512.
  //
  // The browser-passworder package currently uses 10000 iterations
  // (the recommendation from 2011). Here we use 350000.

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltArray,
      iterations: 350000,
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
