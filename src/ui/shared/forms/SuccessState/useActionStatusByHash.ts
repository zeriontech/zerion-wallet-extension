import { useMemo, useRef } from 'react';
import { useStore } from '@store-unit/react';
import { localTransactionsStore } from 'src/ui/transactions/transactions-store';
import type { ClientTransactionStatus } from 'src/modules/ethereum/transactions/addressAction';
import { getTransactionObjectStatus } from 'src/modules/ethereum/transactions/getTransactionObjectStatus';

export function useActionStatusByHash(hash: string) {
  const localActions = useStore(localTransactionsStore);
  const localStatus = useMemo(() => {
    const action = localActions.find(
      (item) => item.transaction?.hash === hash || item.signature === hash
    );
    return action ? getTransactionObjectStatus(action) : null;
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
