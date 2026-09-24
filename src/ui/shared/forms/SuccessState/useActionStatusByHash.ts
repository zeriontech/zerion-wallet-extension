import { useMemo, useRef } from 'react';
import { useStore } from '@store-unit/react';
import { localTransactionsStore } from 'src/ui/transactions/transactions-store';
import { getTransactionObjectStatus } from 'src/modules/ethereum/transactions/getTransactionObjectStatus';
import type { ActionStatus } from 'src/modules/zerion-api/requests/wallet-get-actions';

export function useActionStatusByHash(hash: string | null) {
  const localActions = useStore(localTransactionsStore);
  const localStatus = useMemo(() => {
    const action = localActions.find(
      (item) => item.transaction?.hash === hash || item.signature === hash
    );
    return action ? getTransactionObjectStatus(action) : null;
  }, [localActions, hash]);
  /**
   * Local actions are eventually removed from the store once they expire
   * see `performPurgeCheck` in `TransactionService`
   * To avoid fallback into `pending` state we should use the last non-null status
   */
  const lastNonNullableStatus = useRef<ActionStatus | null>(null);
  if (!hash) {
    return 'pending';
  }

  if (localStatus) {
    lastNonNullableStatus.current = localStatus;
  }
  return lastNonNullableStatus.current || 'pending';
}
