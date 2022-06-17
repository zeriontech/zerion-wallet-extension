import { ethers } from 'ethers';
import type { BareWallet } from './Wallet';

type Origin = string;
type Address = string;

export enum SeedType {
  privateKey,
  mnemonic,
}

export interface BareWalletContainer {
  seedType: SeedType;
  wallet: BareWallet;
}

export interface WalletContainer {
  seedType: SeedType;
  wallet: ethers.Wallet;
}

export class MnemonicWalletContainer implements WalletContainer {
  wallet: ethers.Wallet;
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
  wallet: ethers.Wallet;
  seedType = SeedType.privateKey;

  constructor(wallet: BareWallet) {
    this.wallet = new ethers.Wallet(wallet.privateKey);
  }
}

export interface WalletRecord<
  T extends WalletContainer | BareWalletContainer | null
> {
  walletContainer: T;
  permissions: Record<Origin, Address>;
}

export function createRecord({
  walletContainer,
}: {
  walletContainer: WalletContainer;
}): WalletRecord<WalletContainer> {
  return {
    walletContainer,
    permissions: {},
  };
}
