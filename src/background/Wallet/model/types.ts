import type { ethers } from 'ethers';
import type { WalletAbility } from 'src/shared/types/Daylight';
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

interface PublicPreferences {
  /**
   * Named "Public" because these preferences aren't supposed contain any private info
   * and it's okay to query them from content script (meaning they are technically available to DApps)
   */
  showNetworkSwitchShortcut?: boolean;
  walletNameFlags?: WalletNameFlag[];
}

export interface Permission {
  addresses: Address[];
  chain?: string;
}

// Previous versions are used to perform migrations ("upgrades")
export interface WalletRecordVersion1 {
  version: 1;
  walletManager: WalletManager;
  permissions: Record<Origin, Address[]>;
  transactions: ethers.providers.TransactionResponse[];
  preferences: PublicPreferences;
}

export interface WalletRecordVersion2 {
  version: 2;
  walletManager: WalletManager;
  permissions: Record<Origin, Permission>;
  transactions: ethers.providers.TransactionResponse[];
  preferences: PublicPreferences;
}

export interface WalletRecordVersion3 {
  version: 3;
  walletManager: WalletManager;
  permissions: Record<Origin, Permission>;
  transactions: ethers.providers.TransactionResponse[];
  publicPreferences: PublicPreferences;
}

export interface WalletFeed {
  lastSeenAbilityId: string | null;
  dismissedAbilities: WalletAbility[];
  completedAbilities: WalletAbility[];
}

export interface WalletRecord extends Omit<WalletRecordVersion3, 'version'> {
  version: 4;
  feed: WalletFeed;
}

export interface PendingWallet {
  walletContainer: WalletContainer;
  groupId: string | null;
  origin: WalletOrigin;
}
