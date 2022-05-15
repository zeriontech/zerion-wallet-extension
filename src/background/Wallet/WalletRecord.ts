import { ethers } from 'ethers';
import type { BareWallet } from './Wallet';

type Origin = string;
type Address = string;

export enum SeedType {
  privateKey,
  mnemonic,
}

export interface WalletContainer {
  seedType: SeedType;
  wallet: BareWallet;
}

export class MnemonicWalletContainer implements WalletContainer {
  wallet: BareWallet;
  seedType = SeedType.mnemonic;

  constructor(wallet: BareWallet) {
    if (!wallet.mnemonic) {
      throw new Error(
        'Mnemonic container is expected to have a wallet with a mnemonic'
      );
    }
    this.wallet = ethers.Wallet.fromMnemonic(
      wallet.mnemonic.phrase,
      wallet.mnemonic.path
    );
  }
}

export class PrivateKeyWalletContainer implements WalletContainer {
  wallet: BareWallet;
  seedType = SeedType.privateKey;

  constructor(wallet: BareWallet) {
    this.wallet = new ethers.Wallet(wallet.privateKey);
  }
}

export interface WalletRecord {
  walletContainer: null | WalletContainer;
  permissions: Record<Origin, Address>;
}

export function createEmptyRecord(): WalletRecord {
  return {
    walletContainer: null,
    permissions: {},
  };
}
