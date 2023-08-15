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

interface Field {
  name: string;
  type: string;
}

interface Schema {
  primary_type: string;
  types: Record<string, Field[]>;
}

interface Input {
  data: string;
  schema: Schema;
}

export interface InterpretResponse {
  action: AddressAction;
  inputs: Input[];
  warnings: Warning[];
}
