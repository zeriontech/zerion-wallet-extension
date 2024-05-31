import { valueToHex } from 'src/shared/units/valueToHex';
import type { types as zkSyncTypes } from 'zksync-ethers';
import type { TransactionRequest } from '@ethersproject/abstract-provider';
import type { IncomingTransactionAA } from '../types/IncomingTransaction';

const knownFields: Array<
  | (keyof TransactionRequest & zkSyncTypes.TransactionRequest)
  | 'gasPerPubdataByteLimit'
> = [
  'from',
  'to',
  'nonce',
  'data',
  'value',
  'chainId',
  'type',
  'accessList',
  'gasLimit',
  'gasPrice',
  'maxPriorityFeePerGas',
  'maxFeePerGas',
  'customData',
  'gasPerPubdataByteLimit',
];

export function prepareTransaction(incomingTransaction: IncomingTransactionAA) {
  const transaction: zkSyncTypes.TransactionRequest = {};
  for (const field of knownFields) {
    const knownField = field as keyof TransactionRequest;
    if (incomingTransaction[knownField] !== undefined) {
      // @ts-ignore
      transaction[knownField] = incomingTransaction[knownField];
    }
  }
  if (incomingTransaction.gas) {
    transaction.gasLimit = valueToHex(incomingTransaction.gas);
  }
  if (incomingTransaction.value) {
    transaction.value = valueToHex(incomingTransaction.value);
  }
  if (
    incomingTransaction.chainId &&
    typeof incomingTransaction.chainId === 'string'
  ) {
    transaction.chainId = parseInt(incomingTransaction.chainId);
  }
  if (
    incomingTransaction.type != null &&
    typeof incomingTransaction.type === 'string'
  ) {
    transaction.type = parseInt(incomingTransaction.type);
  }
  return transaction;
}
