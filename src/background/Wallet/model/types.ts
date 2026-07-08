import type { WalletListGroup } from 'src/shared/wallet/wallet-list';
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

export interface AddressBookEntry {
  address: string;
  name?: string;
}

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
  /** Custom field for "data" in Send Form */
  configurableTransactionData?: boolean;
  invitationBannerDismissed?: boolean;
  recentAddresses?: string[];
  addressBook?: AddressBookEntry[];
  mintDnaBannerDismissed?: boolean;
  upgradeDnaBannerDismissed?: boolean;
  inviteFriendsBannerDismissed?: boolean;
  solanaBannerDismissed?: boolean;
  premiumBannerDismissed?: boolean;
  formPremiumBannerDismissed?: boolean;
  usDisclaimerDismissed?: boolean;
  /** @deprecated */
  exploreZeroBannerDismissed?: boolean;
  backupReminderDismissedTime?: number;
  restoreRecoveryPhraseReminderDismissedTime?: number;
  restoreRecoveryPhraseSuccess?: boolean;
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
  enableKeyboardShortcutToSign?: boolean | null;
  showTransactionsOnAssetChart?: boolean;
  walletsOrder?: WalletListGroup[];
  /**
   * When enabled, the Swap form exposes the recipient address selector for
   * same-ecosystem cross-network swaps (so the user can send the received
   * tokens to a different wallet of theirs). Cross-ecosystem swaps require
   * the selector regardless of this flag.
   */
  receiveToAnotherAddress?: boolean;
  /**
   * Normalized recipient addresses for which the user has opted out of the
   * "sending to a read-only wallet" confirmation dialog. Populated by toggling
   * "Don't show for this wallet" when proceeding past the gate.
   */
  addressesExcludedFromReceiverReadonlyWarning?: string[];
  /**
   * Whether the user has already seen (and dismissed) the cross-chain swap
   * onboarding Dialog2 on /swap-form. `undefined` means "not yet shown" —
   * the dialog opens on next visit. Set to `true` on explicit dismissal
   * (Continue / backdrop / Escape), not on navigation-away.
   */
  crossChainSwapOnboardingShown?: boolean;
  /**
   * Whether the user has already seen the SwapButton onboarding Dialog2
   * ("Set. Tap. Swap.") that interrupts the first pre-simulation tap of
   * the SwapButton. Written to `true` ONLY on the Continue Swap CTA; Cancel /
   * backdrop / Escape leave it unset so the dialog re-shows on the next tap.
   */
  oneTapCrossChainSwapOnboardingShown?: boolean;
  perpsOnboardingDismissed?: boolean;
  /**
   * View mode for the Network Distribution chart on the Stats tab:
   * `'grid'` (treemap) or `'lines'` (sorted list with a proportional accent
   * fill). Defaults to `'grid'`. Kept independent from the Protocol chart.
   */
  networkDistributionChartView?: 'grid' | 'lines';
  /**
   * View mode for the Protocol Distribution chart on the Stats tab. Mirrors
   * {networkDistributionChartView} but tracked separately. Defaults to `'grid'`.
   */
  protocolDistributionChartView?: 'grid' | 'lines';
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

export interface WalletRecordVersion4
  extends Omit<WalletRecordVersion3, 'version'> {
  version: 4;
  feed: unknown; // Old WalletFeed type was removed
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
