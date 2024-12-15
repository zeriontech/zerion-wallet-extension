import { ethers } from 'ethers';
import { isValidMnemonic as isValidMnemonicV5 } from '@ethersproject/hdnode';

export function isValidMnemonic(phrase: string) {
  return isValidMnemonicV5(phrase);
}

export function isValidPrivateKey(key: string) {
  const prefixedKey = key.startsWith('0x') ? key : `0x${key}`;
  return ethers.isHexString(prefixedKey, 32);
}
