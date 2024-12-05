import { Wallet as EthersV5Wallet } from '@ethersproject/wallet';
import type { BareWallet } from '../types/BareWallet';

export function walletToObject(
  wallet: EthersV5Wallet | BareWallet
): BareWallet {
  return {
    mnemonic: wallet.mnemonic,
    privateKey: wallet.privateKey,
    address: wallet.address,
    name: wallet instanceof EthersV5Wallet ? null : wallet.name,
  };
}

export function fromEthersWallet(wallet: EthersV5Wallet): BareWallet {
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
    return fromEthersWallet(new EthersV5Wallet(privateKey));
  } else if (mnemonic) {
    const wallet = EthersV5Wallet.fromMnemonic(mnemonic.phrase, mnemonic.path);
    return fromEthersWallet(wallet);
  } else {
    return fromEthersWallet(EthersV5Wallet.createRandom());
  }
}
