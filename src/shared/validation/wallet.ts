import { ethers } from 'ethers';
import { isValidMnemonic as isValidMnemonicV5 } from '@ethersproject/hdnode';
import { isSolanaPrivateKey } from 'src/modules/solana/shared';

export function isValidMnemonic(phrase: string) {
  return isValidMnemonicV5(phrase);
}

export function isValidPrivateKey(rawInput: string) {
  const value = rawInput.trim();
  if (isSolanaPrivateKey(value)) {
    return true;
  }
  const prefixedKey = value.startsWith('0x') ? value : `0x${value}`;
  return ethers.isHexString(prefixedKey, 32);
}
