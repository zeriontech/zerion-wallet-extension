import { ethers } from 'ethers';
import type { BareWallet } from '../model/types';

export function toEthersWallet(wallet: BareWallet): ethers.Wallet {
  const { mnemonic, privateKey } = wallet;
  if (mnemonic) {
    return ethers.Wallet.fromMnemonic(mnemonic.phrase, mnemonic.path);
  } else {
    return new ethers.Wallet(privateKey);
  }
}
