import { useStore } from '@store-unit/react';
import { localTransactionsStore } from './transactions-store';

export function usePendingTransactions() {
  const localTransactions = useStore(localTransactionsStore);
  return localTransactions.filter((txObject) => !txObject.receipt);
}
