import React from 'react';
import { useAddressActions } from 'defi-sdk';
import { useQuery } from 'react-query';
import { toAddressTransaction } from 'src/modules/ethereum/transactions/model';
import type { Action } from 'src/modules/ethereum/transactions/model';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { UIText } from 'src/ui/ui-kit/UIText';
import { ActionsList } from './ActionsList';

function mergeLocalAndBackendActions(local: Action[], backend: Action[]) {
  const backendHashes = new Set(backend.map((tx) => tx.transaction.hash));
  return local
    .filter((tx) => backendHashes.has(tx.transaction.hash) === false)
    .concat(backend);
}

function useMinedAndPendingAddressActions() {
  const { params, ready } = useAddressParams();
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
    hasMore,
    fetchMore,
  } = useAddressActions(
    {
      ...params,
      currency: 'usd',
    },
    {
      limit: 50,
      enabled: ready,
    }
  );

  return {
    value: localAddressActions
      ? mergeLocalAndBackendActions(localAddressActions, value || [])
      : null,
    ...localActionsQuery,
    isLoading: actionsIsLoading || localActionsQuery.isLoading,
    hasMore: Boolean(hasMore),
    fetchMore,
  };
}

export function HistoryList() {
  const {
    value: transactions,
    isLoading,
    fetchMore,
    hasMore,
  } = useMinedAndPendingAddressActions();

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
