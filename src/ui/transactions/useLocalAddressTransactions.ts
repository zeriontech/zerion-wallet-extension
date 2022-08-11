import { useStore } from '@store-unit/react';
import type { AddressParams } from 'defi-sdk';
import { useMemo } from 'react';
import { filterAddressTransactions } from './filterAddressTransactions';
import { localTransactionsStore } from './transactions-store';

export function useLocalAddressTransactions(addressParams: AddressParams) {
  const transactions = useStore(localTransactionsStore);
  return useMemo(
    () => filterAddressTransactions(addressParams, transactions),
    [addressParams, transactions]
  );
}
