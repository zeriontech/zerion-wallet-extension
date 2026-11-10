import { useStore } from 'src/shared/store/useStore';
import { getPendingTransactions } from 'src/modules/ethereum/transactions/model';
import { localTransactionsStore } from './transactions-store';

export function usePendingTransactions() {
  const localTransactions = useStore(localTransactionsStore);
  return getPendingTransactions(localTransactions);
}
