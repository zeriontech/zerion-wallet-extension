import { createNanoEvents } from 'nanoevents';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { Chain } from 'src/modules/networks/Chain';
import type {
  MessageContextParams,
  TransactionContextParams,
  TransactionFormedContext,
} from 'src/shared/types/SignatureContextParams';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { BannerClickedParams, ButtonClickedParams } from 'src/shared/types/button-events';
import type { AssetVisibilityChangedParams } from 'src/shared/types/asset-events';
import type {
  PerpsButtonPressedParams,
  PerpsPositionActionParams,
  PerpsScreenViewedParams,
} from 'src/shared/types/perps-events';
import type { NetworkFeeLevelChangedParams } from 'src/shared/types/network-fee-events';
import type { WindowType } from 'src/shared/types/UrlContext';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { QuoteErrorContext } from 'src/shared/types/QuoteErrorContext';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import type { ConfidentialAnalyticsEvent } from 'src/shared/types/confidential-events';
import type { State as GlobalPreferencesState } from './Wallet/GlobalPreferences';
import type { WalletOrigin } from './Wallet/model/WalletOrigin';
import type { WalletContainer } from './Wallet/model/types';

export interface ScreenViewParams {
  title: string;
  pathname: string;
  previous: string | null;
  address: string | null;
  screenSize: string;
  windowType: WindowType;
}

export interface AssetClickedParams {
  assetId: string;
  pathname: string;
  section: string;
}

export type BackgroundEvents = {
  backgroundScriptInitialized: () => void;
  accountsChanged: () => void;
  chainsUpdated: () => void;
  chainChanged: (chain: Chain, origin: string) => void;
  'ui:chainSelected': (chain: Chain) => void;
  globalError: (data: { name: 'network_error' | 'signing_error'; message: string }) => void;
  switchChainError: (chainId: ChainId, origin: string, error: unknown) => void;
  transactionFormed: (context: TransactionFormedContext) => void;
  transactionSent: (
    result: SignTransactionResult,
    context: { mode: 'default' | 'testnet' } & TransactionContextParams,
  ) => void;
  transactionFailed: (
    errorMessage: string,
    context: { mode: 'default' | 'testnet' } & TransactionContextParams,
  ) => void;
  quoteError: (context: QuoteErrorContext, source: NetworksSource) => void;
  typedDataSigned: (data: { typedData: TypedData; address: string } & MessageContextParams) => void;
  messageSigned: (data: { message: string; address: string } & MessageContextParams) => void;
  userActivity: () => void;
  connectToSiteEvent: (info: { origin: string }) => void;
  sessionExpired: () => void;
  requestAccountsResolved: (data: {
    origin: string;
    address: string;
    /** {explicitly: true} means that user confirmed connection in a dialog. {false} means that we resolve a previously approved address value */
    explicitly: boolean;
  }) => void;
  screenView: (data: ScreenViewParams) => void;
  unlockedAppOpened: () => void;
  firstScreenView: (timestamp: number) => void;
  walletCreated: (wallet: {
    walletContainer: WalletContainer;
    origin: WalletOrigin;
    groupId: string | null;
  }) => void;
  addEthereumChain: (data: { values: [AddEthereumChainParameter]; origin: string }) => void;
  globalPreferencesChange: (
    state: GlobalPreferencesState,
    prevState: GlobalPreferencesState,
  ) => void;
  holdToSignPreferenceChange: (active: boolean) => void;
  keyboardShortcutToSignPreferenceChange: (active: boolean) => void;
  eip6963SupportDetected: (data: { origin: string }) => void;
  uiClosed: (data: { url: string | null }) => void;
  buttonClicked: (data: ButtonClickedParams) => void;
  networkFeeLevelChanged: (data: NetworkFeeLevelChangedParams) => void;
  bannerClicked: (data: BannerClickedParams) => void;
  assetVisibilityChanged: (data: AssetVisibilityChangedParams) => void;
  cloudflareChallengeIssued: () => void;
  assetClicked: (data: AssetClickedParams) => void;
  passkeyLoginEnabled: () => void;
  passkeyLoginDisabled: () => void;
  passwordChangeSuccess: () => void;
  passwordChangeError: () => void; // we do not pass error body to analytics to avoid sensitive data leaks
  mnemonicRestorationShown: () => void;
  mnemonicRestorationSuccess: () => void;
  mnemonicRestorationError: () => void; // we do not pass error body to analytics to avoid sensitive data leaks
  reportLedgerError: (errorMessage: string) => void;
  perpsScreenViewed: (data: PerpsScreenViewedParams) => void;
  perpsButtonPressed: (data: PerpsButtonPressedParams) => void;
  perpsPositionAction: (data: PerpsPositionActionParams) => void;
  confidentialAnalyticsEvent: (data: ConfidentialAnalyticsEvent) => void;
};

export const emitter = createNanoEvents<BackgroundEvents>();

/**
 * Events the extension UI may report over the wallet port. Each one only
 * feeds analytics. Background-internal events (e.g. `sessionExpired`,
 * `transactionSent`) must never be listed here: the UI could then trigger them.
 */
export const UI_ANALYTICS_EVENTS = [
  'buttonClicked',
  'networkFeeLevelChanged',
  'bannerClicked',
  'assetVisibilityChanged',
  'perpsScreenViewed',
  'confidentialAnalyticsEvent',
  'perpsButtonPressed',
  'perpsPositionAction',
  'assetClicked',
  'cloudflareChallengeIssued',
  'passkeyLoginEnabled',
  'passkeyLoginDisabled',
  'passwordChangeSuccess',
  'passwordChangeError',
  'mnemonicRestorationShown',
  'mnemonicRestorationSuccess',
  'mnemonicRestorationError',
  'screenView',
  'transactionFormed',
  'unlockedAppOpened',
] as const satisfies readonly (keyof BackgroundEvents)[];

type UiAnalyticsEventName = (typeof UI_ANALYTICS_EVENTS)[number];

type EventArguments<K extends keyof BackgroundEvents> = Parameters<BackgroundEvents[K]>;

export type UiAnalyticsEvent = {
  [K in UiAnalyticsEventName]: EventArguments<K> extends []
    ? { name: K }
    : { name: K; data: EventArguments<K>[0] };
}[UiAnalyticsEventName];

export function emitUiAnalyticsEvent(event: UiAnalyticsEvent) {
  if (!UI_ANALYTICS_EVENTS.includes(event.name)) {
    throw new Error(`Not a UI analytics event: ${String(event.name)}`);
  }
  // `event` is a union of matching { name, data } pairs, which TypeScript
  // cannot relate across the union when passing them on separately.
  const emit = emitter.emit.bind(emitter) as unknown as (
    name: UiAnalyticsEventName,
    data?: unknown,
  ) => void;
  if ('data' in event) {
    emit(event.name, event.data);
  } else {
    emit(event.name);
  }
}
