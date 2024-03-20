import type { ethers } from 'ethers';
import { createNanoEvents } from 'nanoevents';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Chain } from 'src/modules/networks/Chain';
import type {
  MessageContextParams,
  TransactionContextParams,
} from 'src/shared/types/SignatureContextParams';
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
  chainChanged: (chain: Chain) => void;
  transactionSent: (
    data: { transaction: TransactionResponse } & TransactionContextParams
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
  dappConnection: (data: { origin: string; address: string }) => void;
  screenView: (data: ScreenViewParams) => void;
  firstScreenView: (timestamp: number) => void;
  daylightAction: (data: DaylightEventParams) => void;
  walletCreated: (wallet: {
    walletContainer: WalletContainer;
    origin: WalletOrigin;
    groupId: string | null;
  }) => void;
  addEthereumChain: (data: { values: [NetworkConfig]; origin: string }) => void;
  globalPreferencesChange: (
    state: GlobalPreferencesState,
    prevState: GlobalPreferencesState
  ) => void;
  eip6963SupportDetected: (data: { origin: string }) => void;
}>();
