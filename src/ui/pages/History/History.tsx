import React, { useMemo } from 'react';
import { AddressAction, useAddressActions } from 'defi-sdk';
import { useQuery } from 'react-query';
import {
  PendingAddressAction,
  toAddressTransaction,
} from 'src/modules/ethereum/transactions/model';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { EmptyView } from 'src/ui/components/EmptyView';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { ActionsList } from './ActionsList';

export function sortActions<T extends { datetime?: string }>(actions: T[]) {
  return actions.sort((a, b) => {
    const aDate = a.datetime ? new Date(a.datetime).getTime() : Date.now();
    const bDate = b.datetime ? new Date(b.datetime).getTime() : Date.now();
    return bDate - aDate;
  });
}

const toMs = (value?: string) => (value ? new Date(value).getTime() : 0);

function mergeLocalAndBackendActions(
  local: (AddressAction | PendingAddressAction)[],
  backend: AddressAction[]
) {
  const backendHashes = new Set(backend.map((tx) => tx.transaction.hash));
  const mostRecentBackendAction = toMs(backend[0]?.datetime);
  const merged = local
    .filter((tx) => backendHashes.has(tx.transaction.hash) === false)
    .filter((tx) => toMs(tx.datetime) >= mostRecentBackendAction)
    .concat(backend);
  return sortActions(merged);
}

function useMinedAndPendingAddressActions() {
  const { params } = useAddressParams();
  const localActions = useLocalAddressTransactions(params);

  const { data: localAddressActions, ...localActionsQuery } = useQuery(
    ['pages/history', localActions],
    async () => {
      const networks = await networksStore.load();
      return Promise.all(
        localActions.map((transactionObject) =>
          toAddressTransaction(transactionObject, networks)
        )
      );
    },
    { useErrorBoundary: true }
  );

  const {
    value,
    isLoading: actionsIsLoading,
    hasNext,
    fetchMore,
  } = useAddressActions(
    {
      ...params,
      currency: 'usd',
    },
    {
      limit: 30,
      listenForUpdates: false,
      paginatedCacheMode: 'first-page',
    }
  );

  return useMemo(
    () => ({
      value: localAddressActions
        ? mergeLocalAndBackendActions(localAddressActions, value || [])
        : null,
      ...localActionsQuery,
      isLoading: actionsIsLoading || localActionsQuery.isLoading,
      hasMore: Boolean(hasNext),
      fetchMore,
    }),
    [
      localAddressActions,
      value,
      localActionsQuery,
      hasNext,
      actionsIsLoading,
      fetchMore,
    ]
  );
}

export function HistoryList() {
  const {
    value: transactions,
    isLoading,
    fetchMore,
    hasMore,
  } = useMinedAndPendingAddressActions();

  if (isLoading && !transactions?.length) {
    return null;
  }

  if (!transactions) {
    return null;
  }

  if (!transactions.length) {
    return <EmptyView text="No transactions yet" />;
  }
  return (
    <ActionsList
      actions={transactions}
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={fetchMore}
    />
  );
}
