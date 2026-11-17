import { ethers } from 'ethers';
import { isSolanaPrivateKey } from 'src/modules/solana/shared';

/**
 * Recovery phrases are split on plain spaces only. Any other whitespace would
 * make a phrase that looks right derive keys from a different seed, so it is
 * refused rather than normalised.
 */
export function hasOnlySpaceSeparators(phrase: string) {
  return !/[^\S ]/.test(phrase);
}

export function isValidMnemonic(phrase: string) {
  return hasOnlySpaceSeparators(phrase) && ethers.Mnemonic.isValidMnemonic(phrase);
}

export function isValidPrivateKey(rawInput: string) {
  const value = rawInput.trim();
  if (isSolanaPrivateKey(value)) {
    return true;
  }
  const prefixedKey = value.startsWith('0x') ? value : `0x${value}`;
  return ethers.isHexString(prefixedKey, 32);
}
