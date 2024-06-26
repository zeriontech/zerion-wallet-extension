import type { ethers } from 'ethers';
import type { WalletAbility } from 'src/shared/types/Daylight';
import type { SignerContainer } from './WalletContainer';
import type { WalletOrigin } from './WalletOrigin';
import type { AccountContainer } from './AccountContainer';

export type WalletContainer = SignerContainer | AccountContainer;

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
  internalHardwareGroupCounter?: number;
}

type Origin = string;
type Address = string;

/**
 * Named "Public" because these preferences aren't supposed contain any private info
 * and it's okay to query them from content script (meaning they are technically available to DApps)
 */
interface PublicPreferences {
  /**
   * @deprecated
   * Whether to show DApp Network Switch in Header
   * Defaults to `true`
   */
  showNetworkSwitchShortcut?: boolean;
  /** @deprecated */
  overviewChain?: string;
  /**
   * Allow to configure nonce before signing transactions
   */
  configurableNonce?: boolean;
  invitationBannerDismissed?: boolean;
  recentAddresses?: string[];
  mintDnaBannerDismissed?: boolean;
  upgradeDnaBannerDismissed?: boolean;
  backupReminderDismissedTime?: number;
  /** @deprecated */
  enableTestnets?: boolean;
  /**
   * {testnetMode} has three states:
   * {null} means completely "off"
   * { on: boolean } means that UI can enable a keyboard shortcut for quick toggle
   * { on: true } means we're in testnet mode
   * { on: false } means we're in prod mode, but user can switch quickly using the shortcut
   */
  testnetMode?: null | { on: boolean };
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
  dismissedAbilities: WalletAbility[];
  completedAbilities: WalletAbility[];
}

export interface WalletRecordVersion4
  extends Omit<WalletRecordVersion3, 'version'> {
  version: 4;
  feed: WalletFeed;
}

export interface WalletRecord extends Omit<WalletRecordVersion4, 'version'> {
  version: 5;
  /** This version introduces normalized addresses in "permissions" */
}

export interface PendingWallet {
  walletContainer: WalletContainer;
  groupId: string | null;
  origin: WalletOrigin;
}
