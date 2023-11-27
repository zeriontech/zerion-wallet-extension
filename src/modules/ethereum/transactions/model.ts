import sortBy from 'lodash/sortBy';
import type { StoredTransactions, TransactionObject } from './types';

export function dataToModel(transactions: StoredTransactions) {
  return sortBy(transactions, (item) => item.timestamp ?? Infinity).reverse();
}

export function getPendingTransactions(transactions: StoredTransactions) {
  return transactions.filter((t) => !t.receipt && !t.dropped);
}

export function getTransactionStatus(
  txObject: Pick<TransactionObject, 'receipt' | 'dropped'>
) {
  const { receipt, dropped } = txObject;
  return receipt
    ? receipt.status === 1
      ? 'confirmed'
      : 'failed'
    : dropped
    ? 'dropped'
    : 'pending';
}
