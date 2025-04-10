import { Wallet as EthersV5Wallet } from '@ethersproject/wallet';
import type { BareWallet } from 'src/shared/types/BareWallet';

export function generateRandomRecoveryPhrase() {
  return EthersV5Wallet.createRandom().mnemonic.phrase;
}

export function generateRandomWallet(): BareWallet {
  const wallet = EthersV5Wallet.createRandom();
  return {
    name: null,
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic,
  };
}
