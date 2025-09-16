import { useStore } from '@store-unit/react';
import { useMemo } from 'react';
import { getTransactionObjectStatus } from 'src/modules/ethereum/transactions/getTransactionObjectStatus';
import { localTransactionsStore } from './transactions-store';

export function useTransactionStatus(hash: string | null) {
  const transactions = useStore(localTransactionsStore);
  return useMemo(() => {
    if (hash) {
      const tx = transactions.find((tx) => tx.hash === hash);
      return tx ? getTransactionObjectStatus(tx) : 'pending';
    } else {
      return null;
    }
  }, [hash, transactions]);
}
