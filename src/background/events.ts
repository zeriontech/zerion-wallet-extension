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
import type {
  BannerClickedParams,
  ButtonClickedParams,
} from 'src/shared/types/button-events';
import type { WindowType } from 'src/shared/types/UrlContext';
import type { SignTransactionResult } from 'src/shared/types/SignTransactionResult';
import type { QuoteErrorContext } from 'src/shared/types/QuoteErrorContext';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
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

export interface DaylightEventParams {
  event_name: string;
  address: string;
  [key: string]: string;
}

export interface AssetClickedParams {
  assetId: string;
  pathname: string;
  section: string;
}

export const emitter = createNanoEvents<{
  backgroundScriptInitialized: () => void;
  accountsChanged: () => void;
  chainsUpdated: () => void;
  chainChanged: (chain: Chain, origin: string) => void;
  'ui:chainSelected': (chain: Chain) => void;
  globalError: (data: {
    name: 'network_error' | 'signing_error';
    message: string;
  }) => void;
  switchChainError: (chainId: ChainId, origin: string, error: unknown) => void;
  transactionFormed: (context: TransactionFormedContext) => void;
  transactionSent: (
    result: SignTransactionResult,
    context: { mode: 'default' | 'testnet' } & TransactionContextParams
  ) => void;
  transactionFailed: (
    errorMessage: string,
    context: { mode: 'default' | 'testnet' } & TransactionContextParams
  ) => void;
  quoteError: (context: QuoteErrorContext, source: NetworksSource) => void;
  typedDataSigned: (
    data: { typedData: TypedData; address: string } & MessageContextParams
  ) => void;
  messageSigned: (
    data: { message: string; address: string } & MessageContextParams
  ) => void;
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
  daylightAction: (data: DaylightEventParams) => void;
  walletCreated: (wallet: {
    walletContainer: WalletContainer;
    origin: WalletOrigin;
    groupId: string | null;
  }) => void;
  addEthereumChain: (data: {
    values: [AddEthereumChainParameter];
    origin: string;
  }) => void;
  globalPreferencesChange: (
    state: GlobalPreferencesState,
    prevState: GlobalPreferencesState
  ) => void;
  holdToSignPreferenceChange: (active: boolean) => void;
  eip6963SupportDetected: (data: { origin: string }) => void;
  uiClosed: (data: { url: string | null }) => void;
  buttonClicked: (data: ButtonClickedParams) => void;
  bannerClicked: (data: BannerClickedParams) => void;
  cloudflareChallengeIssued: () => void;
  assetClicked: (data: AssetClickedParams) => void;
  passkeyLoginEnabled: () => void;
  passkeyLoginDisabled: () => void;
  passwordChangeSuccess: () => void;
  passwordChangeError: () => void; // we do not pass error body to analytics to avoid sensitive data leaks
  reportLedgerError: (errorMessage: string) => void;
}>();
