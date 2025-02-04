import { useMemo } from 'react';
import { useStore } from '@store-unit/react';
import { transactionReceiptToActionStatus } from 'src/modules/ethereum/transactions/addressAction/creators';
import { localTransactionsStore } from 'src/ui/transactions/transactions-store';

export function useActionStatusByHash(hash: string | null) {
  const localActions = useStore(localTransactionsStore);
  return useMemo(() => {
    const action = localActions.find((item) => item.transaction.hash === hash);
    return action ? transactionReceiptToActionStatus(action) : 'pending';
  }, [localActions, hash]);
}
