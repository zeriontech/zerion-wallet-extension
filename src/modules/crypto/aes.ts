import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64ToUint8Array,
  uint8ArrayToUtf8,
  utf8ToUint8Array,
} from './convert';
import { createCryptoKey, createSalt } from './key';
import { getRandomUint8Array } from './random';

type Encrypted = {
  salt: string;
  iv: string;
  data: string;
};

function getIV() {
  return getRandomUint8Array(16);
}

/**
 * Encrypts data with a given password.
 */
export async function encrypt<T>(
  password: string,
  obj: T,
  salt: string = createSalt()
): Promise<string> {
  const dataJSON = JSON.stringify(obj);
  const dataArray = utf8ToUint8Array(dataJSON);

  const iv = getIV();
  const key = await createCryptoKey(password, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataArray
  );

  const ivBase64 = arrayBufferToBase64(iv);
  const encryptedBase64 = arrayBufferToBase64(encryptedBuffer);

  const encrypted: Encrypted = { iv: ivBase64, data: encryptedBase64, salt };
  return JSON.stringify(encrypted);
}

/**
 * Decrypts a given JSON string.
 */
export async function decrypt<T>(password: string, json: string): Promise<T> {
  const {
    iv: ivBase64,
    data: dataBase64,
    salt,
  } = JSON.parse(json) as Encrypted;
  const dataArray = base64ToUint8Array(dataBase64);

  const iv = base64ToArrayBuffer(ivBase64);
  const key = await createCryptoKey(password, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    dataArray
  );

  const decryptedArray = new Uint8Array(decryptedBuffer);
  const decryptedString = uint8ArrayToUtf8(decryptedArray);

  return JSON.parse(decryptedString);
}
