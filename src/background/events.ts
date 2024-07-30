import type { ethers } from 'ethers';
import { createNanoEvents } from 'nanoevents';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { Chain } from 'src/modules/networks/Chain';
import type {
  MessageContextParams,
  TransactionContextParams,
} from 'src/shared/types/SignatureContextParams';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { State as GlobalPreferencesState } from './Wallet/GlobalPreferences';
import type { WalletOrigin } from './Wallet/model/WalletOrigin';
import type { WalletContainer } from './Wallet/model/types';

type TransactionResponse = ethers.providers.TransactionResponse;

export interface ScreenViewParams {
  pathname: string;
  previous: string | null;
  address: string | null;
  screenSize: string;
}

export interface DaylightEventParams {
  event_name: string;
  address: string;
  [key: string]: string;
}

export const emitter = createNanoEvents<{
  accountsChanged: () => void;
  chainsUpdated: () => void;
  chainChanged: (chain: Chain, origin: string) => void;
  'ui:chainSelected': (chain: Chain) => void;
  switchChainError: (chainId: ChainId, origin: string, error: unknown) => void;
  transactionSent: (
    data: {
      transaction: TransactionResponse;
      mode: 'default' | 'testnet';
    } & TransactionContextParams
  ) => void;
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
    /** {explicitly: true} means that user confirmed connection in a dialog. {false} means that we resolve a previously approved addess value */
    explicitly: boolean;
  }) => void;
  screenView: (data: ScreenViewParams) => void;
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
  eip6963SupportDetected: (data: { origin: string }) => void;
}>();
