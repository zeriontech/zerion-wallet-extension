import { useStore } from '@store-unit/react';
import { useMemo } from 'react';
import { getTransactionStatus } from 'src/modules/ethereum/transactions/model';
import { localTransactionsStore } from './transactions-store';

export function useTransactionStatus(hash: string | null) {
  const transactions = useStore(localTransactionsStore);
  return useMemo(() => {
    if (hash) {
      const tx = transactions.find((tx) => tx.hash === hash);
      return tx ? getTransactionStatus(tx) : null;
    } else {
      return null;
    }
  }, [hash, transactions]);
}
