import { ethers } from 'ethers';
import type { BareWallet } from '../types/BareWallet';

export function walletToObject(wallet: ethers.Wallet | BareWallet): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: wallet instanceof ethers.Wallet ? null : wallet.name,
  };
}

export function fromEthersWallet(wallet: ethers.Wallet): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: null,
  };
}

export function restoreBareWallet(wallet: Partial<BareWallet>): BareWallet {
  const { address, privateKey, mnemonic, name } = wallet;
  if (address && privateKey) {
    return {
      privateKey,
      address,
      mnemonic: mnemonic || null,
      name: name || null,
    };
  } else if (privateKey) {
    return fromEthersWallet(new ethers.Wallet(privateKey));
  } else if (mnemonic) {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic.phrase, mnemonic.path);
    return fromEthersWallet(wallet);
  } else {
    return fromEthersWallet(ethers.Wallet.createRandom());
  }
}
