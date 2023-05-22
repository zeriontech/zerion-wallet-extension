import type { ethers } from 'ethers';

export interface TransactionObject {
  hash: string;
  timestamp: number;
  transaction: ethers.providers.TransactionResponse;
  initiator: string;
  receipt?: ethers.providers.TransactionReceipt;
  dropped?: boolean;
}

export type StoredTransactions = Array<TransactionObject>;
