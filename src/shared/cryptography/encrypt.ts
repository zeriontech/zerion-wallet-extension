import { keyFromPassword } from '@metamask/browser-passworder';
import {
  base64ToArrayBuffer,
  arrayBufferToBase64,
} from 'src/modules/crypto/convert';

export async function createCryptoKey({
  password,
  salt,
}: {
  password: string;
  salt: string;
}) {
  return keyFromPassword(password, salt);
}

export async function stableEncrypt<T>(key: CryptoKey, data: T) {
  const str = JSON.stringify(data);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(12),
    },
    key,
    new TextEncoder().encode(str)
  );
  return arrayBufferToBase64(encrypted);
}

export async function stableDecrypt<T>(
  key: CryptoKey,
  data: string
): Promise<T> {
  const encrypted = base64ToArrayBuffer(data);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(12),
    },
    key,
    encrypted
  );
  const str = new TextDecoder().decode(new Uint8Array(decrypted));
  return JSON.parse(str);
}
