import { AddressTransaction, useSubscription } from 'defi-sdk';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { toAddressTransaction } from 'src/modules/ethereum/transactions/model';
import type { PartialAddressTransaction } from 'src/modules/ethereum/transactions/model';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { UIText } from 'src/ui/ui-kit/UIText';
import { TransactionsList } from './TransactionsList';

function mergeLocalAndBackendTransactions(
  local: PartialAddressTransaction[],
  backend: PartialAddressTransaction[]
) {
  const backendHashes = new Set(backend.map((tx) => tx.hash));
  return local
    .filter((tx) => backendHashes.has(tx.hash) === false)
    .concat(backend);
}

function useMinedAndPendingAddressTransactions() {
  const { params, ready } = useAddressParams();
  const localTransactions = useLocalAddressTransactions(params);

  const { data: localAddressTransactions, ...localTransactionsQuery } =
    useQuery(
      ['pages/history', localTransactions],
      () => {
        return Promise.all(
          localTransactions.map((transactionObject) =>
            toAddressTransaction(transactionObject)
          )
        );
      },
      { useErrorBoundary: true }
    );

  const { value } = useSubscription<
    AddressTransaction[],
    'address',
    'transactions'
  >({
    enabled: ready,
    namespace: 'address',
    body: useMemo(
      () => ({
        scope: ['transactions'],
        payload: {
          ...params,
          currency: 'usd',
          transactions_limit: 50,
          transactions_offset: 0,
        },
      }),
      [params]
    ),
  });
  return {
    data: localAddressTransactions
      ? mergeLocalAndBackendTransactions(localAddressTransactions, value || [])
      : null,
    ...localTransactionsQuery,
  };
}

export function HistoryList() {
  const { data: transactions, isLoading } =
    useMinedAndPendingAddressTransactions();
  if (isLoading || !transactions) {
    return null;
  }
  if (!transactions.length) {
    return (
      <UIText
        kind="subtitle/l_reg"
        color="var(--neutral-500)"
        style={{ textAlign: 'center' }}
      >
        No transactions
      </UIText>
    );
  }
  return <TransactionsList transactions={transactions} />;
}
