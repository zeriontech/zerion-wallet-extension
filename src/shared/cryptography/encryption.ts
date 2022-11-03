import { keyFromPassword } from '@metamask/browser-passworder';

export async function createCryptoKey({
  password,
  salt,
}: {
  password: string;
  salt: string;
}) {
  return keyFromPassword(password, salt);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
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
