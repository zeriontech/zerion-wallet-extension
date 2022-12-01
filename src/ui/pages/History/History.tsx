import React, { useMemo } from 'react';
import { AddressAction, useAddressActions } from 'defi-sdk';
import { useQuery } from 'react-query';
import {
  PendingAddressAction,
  toAddressTransaction,
} from 'src/modules/ethereum/transactions/model';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { UIText } from 'src/ui/ui-kit/UIText';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { ActionsList } from './ActionsList';

export function sortActions<T extends { datetime?: string }>(actions: T[]) {
  return actions.sort((a, b) => {
    const aDate = a.datetime ? new Date(a.datetime).getTime() : Date.now();
    const bDate = b.datetime ? new Date(b.datetime).getTime() : Date.now();
    return bDate - aDate;
  });
}

function mergeLocalAndBackendActions(
  local: (AddressAction | PendingAddressAction)[],
  backend: AddressAction[]
) {
  const backendHashes = new Set(backend.map((tx) => tx.transaction.hash));
  const lastBackendAction = backend[backend.length - 1];
  return sortActions(
    local
      .filter((tx) => backendHashes.has(tx.transaction.hash) === false)
      .concat(backend)
  ).filter(
    (item) =>
      !lastBackendAction ||
      (item.datetime &&
        new Date(item.datetime).getTime() >
          new Date(lastBackendAction.datetime).getTime())
  );
}

function useMinedAndPendingAddressActions() {
  const { params } = useAddressParams();
  const localActions = useLocalAddressTransactions(params);

  const { data: localAddressActions, ...localActionsQuery } = useQuery(
    ['pages/history', localActions],
    () => {
      return Promise.all(
        localActions.map((transactionObject) =>
          toAddressTransaction(transactionObject)
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
      listenForUpdates: true,
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

  if (isLoading) {
    return <ViewLoading size="48px" />;
  }

  if (!transactions) {
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
  return (
    <ActionsList
      actions={transactions}
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={fetchMore}
    />
  );
}
