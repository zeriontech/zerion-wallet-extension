import { entropyToMnemonic } from '@ethersproject/hdnode';
import { Wallet, randomBytes } from 'ethers';

export function generateRandomRecoveryPhrase() {
  const entropy = randomBytes(16);
  return entropyToMnemonic(entropy);
}

export function generateRandomWallet() {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}
