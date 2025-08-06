import type { WalletAbility } from 'src/shared/types/Daylight';
import type { SignerContainer } from './WalletContainer';
import type { WalletOrigin } from './WalletOrigin';
import type { AccountContainer } from './AccountContainer';
import type { EthersV5TransactionResponse } from './ethers-v5-types';
import type { ActivityRecord } from './ActivityRecord';

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
  recentSearch?: string[];
  mintDnaBannerDismissed?: boolean;
  upgradeDnaBannerDismissed?: boolean;
  inviteFriendsBannerDismissed?: boolean;
  solanaBannerDismissed?: boolean;
  premiumBannerDismissed?: boolean;
  formPremiumBannerDismissed?: boolean;
  /** @deprecated */
  exploreZeroBannerDismissed?: boolean;
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
  enableHoldToSignButton?: boolean | null;
  showTransactionsOnAssetChart?: boolean;
}

export interface Permission {
  addresses: Address[];
  /** implies evm chain */
  chain?: string;
  solanaChain?: string;
}

// Previous versions are used to perform migrations ("upgrades")
export interface WalletRecordVersion1 {
  version: 1;
  walletManager: WalletManager;
  permissions: Record<Origin, Address[]>;
  transactions: EthersV5TransactionResponse[];
  preferences: PublicPreferences;
}

export interface WalletRecordVersion2 {
  version: 2;
  walletManager: WalletManager;
  permissions: Record<Origin, Permission>;
  transactions: EthersV5TransactionResponse[];
  preferences: PublicPreferences;
}

export interface WalletRecordVersion3 {
  version: 3;
  walletManager: WalletManager;
  permissions: Record<Origin, Permission>;
  transactions: EthersV5TransactionResponse[];
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

export interface WalletRecordVersion5
  extends Omit<WalletRecordVersion4, 'version'> {
  /** This version introduces normalized addresses in "permissions", see ./versions.ts */
  version: 5;
}

export interface WalletRecord extends Omit<WalletRecordVersion5, 'version'> {
  version: 6;
  activityRecord: ActivityRecord;
}

export interface PendingWallet {
  walletContainer: WalletContainer;
  groupId: string | null;
  origin: WalletOrigin;
}
