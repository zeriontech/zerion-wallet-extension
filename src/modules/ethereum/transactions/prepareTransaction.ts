import { valueToHex } from 'src/shared/units/valueToHex';
import type {
  IncomingTransaction,
  IncomingTransactionAA,
  PlainTransactionRequest,
} from '../types/IncomingTransaction';

const knownFields: Array<keyof IncomingTransaction> = [
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
  'maxFeePerBlobGas',
];

export function prepareTransaction(incomingTransaction: IncomingTransactionAA) {
  const transaction: PlainTransactionRequest = {};
  for (const field of knownFields) {
    const knownField = field as keyof IncomingTransactionAA;
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
