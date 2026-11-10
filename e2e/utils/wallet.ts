import { Wallet } from 'ethers';
import type { BareWallet } from 'src/shared/types/BareWallet';

export function generateRandomRecoveryPhrase() {
  const mnemonic = Wallet.createRandom().mnemonic;
  if (!mnemonic) {
    throw new Error('Expected a mnemonic for a random wallet');
  }
  return mnemonic.phrase;
}

export function generateRandomWallet(): BareWallet {
  const wallet = Wallet.createRandom();
  return {
    name: null,
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic:
      wallet.mnemonic && wallet.path ? { phrase: wallet.mnemonic.phrase, path: wallet.path } : null,
  };
}
