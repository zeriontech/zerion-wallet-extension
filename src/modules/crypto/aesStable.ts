import {
  base64ToArrayBuffer,
  arrayBufferToBase64,
  arrayBufferToUtf8,
  utf8ToUint8Array,
} from './convert';

export async function stableEncrypt<T>(key: CryptoKey, obj: T) {
  const dataJSON = JSON.stringify(obj);
  const dataArray = utf8ToUint8Array(dataJSON);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: getIV() },
    key,
    dataArray
  );
  return arrayBufferToBase64(encryptedBuffer);
}

export async function stableDecrypt<T>(
  key: CryptoKey,
  base64: string
): Promise<T> {
  const encryptedBuffer = base64ToArrayBuffer(base64);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: getIV() },
    key,
    encryptedBuffer
  );
  const decryptedString = arrayBufferToUtf8(decryptedBuffer);

  return JSON.parse(decryptedString);
}

function getIV() {
  return new Uint8Array(12);
}
