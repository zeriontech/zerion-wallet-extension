import type { BareWallet } from './Wallet';

type Origin = string;
type Address = string;

export enum ContainerType {
  privateKey,
  mnemonic,
}

export interface WalletContainer {
  type: ContainerType;
  wallet: BareWallet;
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
