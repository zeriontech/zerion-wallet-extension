import { ethers } from 'ethers';

export function isValidMnemonic(phrase: string) {
  return ethers.utils.isValidMnemonic(phrase);
}

export function isValidPrivateKey(key: string) {
  const prefixedKey = key.startsWith('0x') ? key : `0x${key}`;
  return ethers.utils.isHexString(prefixedKey, 32);
}
