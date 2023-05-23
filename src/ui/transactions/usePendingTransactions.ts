import { useStore } from '@store-unit/react';
import { getPendingTransactions } from 'src/modules/ethereum/transactions/model';
import { localTransactionsStore } from './transactions-store';

export function usePendingTransactions() {
  const localTransactions = useStore(localTransactionsStore);
  return getPendingTransactions(localTransactions);
}
