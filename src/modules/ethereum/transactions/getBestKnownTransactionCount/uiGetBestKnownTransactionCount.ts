import { localTransactionsStore } from 'src/ui/transactions/transactions-store';
import { getBestKnownTransactionCount } from '../getTransactionCount';

export async function uiGetBestKnownTransactionCount(
  params: Parameters<typeof getBestKnownTransactionCount>[1]
) {
  const state = localTransactionsStore.getState();
  return getBestKnownTransactionCount(state, params);
}
