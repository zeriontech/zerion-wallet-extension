import { useStore } from '@store-unit/react';
import type { AddressParams } from 'defi-sdk';
import { useMemo } from 'react';
import { filterAddressTransactions } from './filterAddressTransactions';
import { localTransactionsStore } from './transactions-store';

export function useLocalAddressTransactions(addressParams: AddressParams) {
  const transactions = useStore(localTransactionsStore);
  return useMemo(() => {
    const values = filterAddressTransactions(addressParams, transactions);
    const relatedHashes = new Set();
    for (const value of values) {
      if (value.relatedTransactionHash) {
        relatedHashes.add(value.relatedTransactionHash);
      }
    }
    return values.filter((value) => relatedHashes.has(value.hash) === false);
  }, [addressParams, transactions]);
}
