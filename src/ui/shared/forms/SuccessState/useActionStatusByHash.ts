import { useMemo, useRef } from 'react';
import { useStore } from '@store-unit/react';
import { transactionReceiptToActionStatus } from 'src/modules/ethereum/transactions/addressAction/creators';
import { localTransactionsStore } from 'src/ui/transactions/transactions-store';
import type { ClientTransactionStatus } from 'src/modules/ethereum/transactions/addressAction';

export function useActionStatusByHash(hash: string) {
  const localActions = useStore(localTransactionsStore);
  const localStatus = useMemo(() => {
    const action = localActions.find((item) => item.transaction.hash === hash);
    return action ? transactionReceiptToActionStatus(action) : null;
  }, [localActions, hash]);

  /**
   * Every ~4 mins we remove local actions from the store that our backend has already processed
   * see `performPurgeCheck` in `TransactionService`
   * To avoid fallback into `pending` state we should use the last non-null status
   */
  const lastNonNullableStatus = useRef<ClientTransactionStatus | null>(null);
  if (localStatus) {
    lastNonNullableStatus.current = localStatus;
  }
  return lastNonNullableStatus.current || 'pending';
}
