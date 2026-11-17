import { ethers } from 'ethers';
import type { BareWallet } from 'src/shared/types/BareWallet';

export function generateRandomRecoveryPhrase() {
  const phrase = ethers.Wallet.createRandom().mnemonic?.phrase;
  if (!phrase) {
    throw new Error('Random wallet has no recovery phrase');
  }
  return phrase;
}

export function generateRandomWallet(): BareWallet {
  const wallet = ethers.Wallet.createRandom();
  if (!wallet.mnemonic || !wallet.path) {
    throw new Error('Random wallet has no recovery phrase');
  }
  return {
    name: null,
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: { phrase: wallet.mnemonic.phrase, path: wallet.path },
  };
}
