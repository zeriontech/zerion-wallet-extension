import {
  base64ToArrayBuffer,
  arrayBufferToBase64,
  arrayBufferToUtf8,
  utf8ToUint8Array,
} from './convert';
import type { StableEncrypted } from './types';

const VERSION = 1;

function getIV() {
  return new Uint8Array(12);
}

export async function stableEncryptObject<T>(
  key: CryptoKey,
  obj: T
): Promise<StableEncrypted> {
  const dataJSON = JSON.stringify(obj);
  const dataArray = utf8ToUint8Array(dataJSON);
  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: getIV() },
    key,
    dataArray
  );
  return {
    data: arrayBufferToBase64(encryptedBuffer),
    version: VERSION,
  };
}

export async function stableEncrypt<T>(
  key: CryptoKey,
  obj: T
): Promise<string> {
  const encrypted = await stableEncryptObject(key, obj);
  return JSON.stringify(encrypted);
}

export async function stableDecryptObject<T>(
  key: CryptoKey,
  encrypted: StableEncrypted
): Promise<T> {
  const encryptedBuffer = base64ToArrayBuffer(encrypted.data);
  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: getIV() },
    key,
    encryptedBuffer
  );
  const decryptedString = arrayBufferToUtf8(decryptedBuffer);
  return JSON.parse(decryptedString);
}

export async function stableDecrypt<T>(
  key: CryptoKey,
  json: string
): Promise<T> {
  const encrypted = JSON.parse(json) as StableEncrypted;
  return stableDecryptObject(key, encrypted);
}
