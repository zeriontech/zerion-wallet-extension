import type { AddressAction } from 'defi-sdk';
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

interface Warning {
  severity: string;
  message: string;
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
  action: AddressAction;
  input?: InterpretInput;
  warnings: Warning[];
}
