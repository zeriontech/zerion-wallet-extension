import type { ethers } from 'ethers';

export interface TransactionObject {
  hash: string;
  timestamp: number;
  transaction: ethers.providers.TransactionResponse;
  initiator: string;
  receipt?: ethers.providers.TransactionReceipt;
}

export type StoredTransactions = Array<TransactionObject>;
