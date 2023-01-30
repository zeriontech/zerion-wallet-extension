import type { ethers } from 'ethers';
import { createNanoEvents } from 'nanoevents';
import type { TypedData } from 'src/modules/ethereum/message-signing/TypedData';

type TransactionResponse = ethers.providers.TransactionResponse;
type TransactionReceipt = ethers.providers.TransactionReceipt;

export const emitter = createNanoEvents<{
  accountsChanged: () => void;
  chainChanged: () => void;
  transactionSent: (data: {
    transaction: TransactionResponse;
    initiator: string;
    feeValueCommon: string | null;
  }) => void;
  transactionMined: (transaction: TransactionReceipt) => void;
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
}>();
