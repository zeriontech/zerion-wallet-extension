import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64ToUint8Array,
  uint8ArrayToUtf8,
  utf8ToUint8Array,
} from './convert';
import { createCryptoKey, createSalt } from './key';
import { getRandomUint8Array } from './random';
import { Encrypted } from './types';

const VERSION = 1;

function getIV() {
  return getRandomUint8Array(16);
}

async function encryptObject<T>(
  password: string,
  obj: T,
  salt: string = createSalt()
): Promise<Encrypted> {
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

  return {
    iv: ivBase64,
    data: encryptedBase64,
    salt,
    version: VERSION,
  };
}

/**
 * Encrypts data with a given password.
 */
export async function encrypt<T>(
  password: string,
  obj: T,
  salt: string = createSalt()
): Promise<string> {
  const encrypted = await encryptObject(password, obj, salt);
  return JSON.stringify(encrypted);
}

async function decryptObject<T>(
  password: string,
  encrypted: Encrypted
): Promise<T> {
  const { iv: ivBase64, data: dataBase64, salt } = encrypted;
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

/**
 * Decrypts a given JSON string.
 */
export async function decrypt<T>(password: string, json: string): Promise<T> {
  const encrypted = JSON.parse(json) as Encrypted;
  return decryptObject(password, encrypted);
}
