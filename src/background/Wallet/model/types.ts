import type { ethers } from 'ethers';
import type { WalletContainer } from './WalletContainer';
import { WalletNameFlag } from './WalletNameFlag';
import { WalletOrigin } from './WalletOrigin';

export interface BareWallet {
  mnemonic: { phrase: string; path: string } | null;
  privateKey: ethers.Wallet['privateKey'];
  address: ethers.Wallet['address'];
  name: string | null;
}

export interface WalletGroup {
  id: string;
  walletContainer: WalletContainer;
  name: string;
  lastBackedUp: number | null;
  origin: WalletOrigin | null;
  created: number;
}

interface WalletManager {
  groups: WalletGroup[];
  currentAddress: string | null;
  internalMnemonicGroupCounter: number;
}

type Origin = string;
type Address = string;

interface Preferences {
  showNetworkSwitchShortcut?: boolean;
  walletNameFlags?: WalletNameFlag[];
}

// Previous versions are used to perform migrations ("upgrades")
export interface WalletRecordVersion0 {
  walletManager: WalletManager;
  permissions: Record<Origin, Address[]>;
  transactions: ethers.providers.TransactionResponse[];
}

export interface Permission {
  addresses: Address[];
  chain?: string;
}

export interface WalletRecordVersion1 {
  version: 1;
  walletManager: WalletManager;
  permissions: Record<Origin, Address[]>;
  transactions: ethers.providers.TransactionResponse[];
  preferences: Preferences;
}

export interface WalletRecord {
  version: 2;
  walletManager: WalletManager;
  permissions: Record<Origin, Permission>;
  transactions: ethers.providers.TransactionResponse[];
  preferences: Preferences;
}

export interface PendingWallet {
  walletContainer: WalletContainer;
  groupId: string | null;
  origin: WalletOrigin;
}
