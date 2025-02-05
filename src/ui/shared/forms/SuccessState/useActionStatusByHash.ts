import { useMemo, useRef } from 'react';
import { useStore } from '@store-unit/react';
import { transactionReceiptToActionStatus } from 'src/modules/ethereum/transactions/addressAction/creators';
import { localTransactionsStore } from 'src/ui/transactions/transactions-store';

function useCachedValue<T>(key: string, value: T | null) {
  const keyRef = useRef(key);
  const savedRef = useRef(value);

  if (keyRef.current !== key) {
    keyRef.current = key;
    savedRef.current = null;
  }

  if (value !== null) {
    savedRef.current = value;
  }

  return savedRef.current;
}

export function useActionStatusByHash(hash: string) {
  const localActions = useStore(localTransactionsStore);
  const localStatus = useMemo(() => {
    const action = localActions.find((item) => item.transaction.hash === hash);
    return action ? transactionReceiptToActionStatus(action) : null;
  }, [localActions, hash]);

  /**
   * Once we get any status update for the local action, we should save it
   * And use it even after this local action has been removed
   */
  return useCachedValue(hash, localStatus) || 'pending';
}
