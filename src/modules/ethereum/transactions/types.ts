import type { AddressAction } from 'defi-sdk';
import type { ethers } from 'ethers';

export interface TransactionObject {
  hash: string;
  timestamp: number;
  transaction: ethers.providers.TransactionResponse;
  initiator: string;
  receipt?: ethers.providers.TransactionReceipt;
  dropped?: boolean;
  relatedTransactionHash?: string; // hash of related transaction (cancelled or sped-up)
}

export type StoredTransactions = Array<TransactionObject>;

export type WarningSeverity = 'Red' | 'Orange' | 'Yellow' | 'Gray';

interface Warning {
  severity: WarningSeverity;
  title?: string;
  description: string;
  details?: string;
}

interface Block {
  name: string;
  value: string;
}

interface Section {
  name: string | null;
  blocks: Block[];
}

export interface InterpretInput {
  sections: Section[];
}

export interface InterpretResponse {
  action: AddressAction | null;
  input?: InterpretInput;
  warnings: Warning[];
}
