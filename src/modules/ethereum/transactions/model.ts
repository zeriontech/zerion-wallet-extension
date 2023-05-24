import sortBy from 'lodash/sortBy';
import type { StoredTransactions } from './types';

export function dataToModel(transactions: StoredTransactions) {
  return sortBy(transactions, (item) => item.timestamp ?? Infinity).reverse();
}

export function getPendingTransactions(transactions: StoredTransactions) {
  return transactions.filter((t) => !t.receipt && !t.dropped);
}
