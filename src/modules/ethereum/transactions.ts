import type { UnsignedTransaction } from 'ethers';
import type { IncomingTransaction } from './types/IncomingTransaction';

const knownFields: Array<keyof UnsignedTransaction> = [
  'to',
  'nonce',
  'gasLimit',
  'gasPrice',
  'data',
  'value',
  'chainId',
  'type',
  'accessList',
  'maxPriorityFeePerGas',
  'maxFeePerGas',
];

export function prepareTransaction(incomingTransaction: IncomingTransaction) {
  const transaction: UnsignedTransaction = {};
  for (const field of knownFields) {
    const knownField = field as keyof UnsignedTransaction;
    if (incomingTransaction[knownField]) {
      // @ts-ignore
      transaction[knownField] = incomingTransaction[knownField];
    }
  }
  if (incomingTransaction.gas) {
    transaction.gasLimit = incomingTransaction.gas;
  }
  if (
    incomingTransaction.chainId &&
    typeof incomingTransaction.chainId === 'string'
  ) {
    transaction.chainId = parseInt(incomingTransaction.chainId);
  }
  return transaction;
}
