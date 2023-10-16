import { ethers } from 'ethers';
import type { BareWallet } from '../model/BareWallet';

export function toEthersWallet(wallet: BareWallet): ethers.Wallet {
  const { privateKey } = wallet;
  // NOTE:
  // ethers Wallet can be created from either privateKey or a mnemonic
  // but because we keep mnemonic phrases encrypted, this helper is used
  // to create a signer, for which a private key is enough. All mnemonic wallets
  // have a private key, so we don't try to access mnemonic here.
  return new ethers.Wallet(privateKey);
}
