import { sort } from 'moderndash';
import type { StoredTransactions, TransactionObject } from './types';
import { getTransactionObjectStatus } from './getTransactionObjectStatus';

export function dataToModel(transactions: StoredTransactions) {
  return sort(transactions, { by: (item) => item.timestamp ?? Infinity }).reverse();
}

export function isPendingTransaction(item: TransactionObject): boolean {
  return getTransactionObjectStatus(item) === 'pending';
}

export function getPendingTransactions(transactions: StoredTransactions) {
  return transactions.filter((t) => isPendingTransaction(t));
}
