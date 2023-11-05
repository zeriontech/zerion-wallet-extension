import type { ethers } from 'ethers';
import { createNanoEvents } from 'nanoevents';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
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
  chainChanged: () => void;
  transactionSent: (data: {
    transaction: TransactionResponse;
    initiator: string;
    feeValueCommon: string | null;
  }) => void;
  typedDataSigned: (data: {
    typedData: TypedData;
    initiator: string;
    address: string;
  }) => void;
  messageSigned: (data: {
    message: string;
    initiator: string;
    address: string;
  }) => void;
  userActivity: () => void;
  connectToSiteEvent: (info: { origin: string }) => void;
  sessionExpired: () => void;
  dappConnection: (data: { origin: string; address: string }) => void;
  screenView: (data: ScreenViewParams) => void;
  daylightAction: (data: DaylightEventParams) => void;
  walletCreated: (wallet: {
    walletContainer: WalletContainer;
    origin: WalletOrigin;
    groupId: string | null;
  }) => void;
  addEthereumChain: (data: { values: [NetworkConfig]; origin: string }) => void;
  updateEthereumChain: (data: {
    values: [NetworkConfig];
    origin: string;
  }) => void;
}>();
