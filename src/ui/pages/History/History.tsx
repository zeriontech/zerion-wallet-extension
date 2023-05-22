import React, { useMemo } from 'react';
import type { AddressAction } from 'defi-sdk';
import { useAddressActions } from 'defi-sdk';
import { useQuery } from 'react-query';
import type { PendingAddressAction } from 'src/modules/ethereum/transactions/model';
import { toAddressTransaction } from 'src/modules/ethereum/transactions/model';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { NetworkSelect } from 'src/ui/pages/Networks/NetworkSelect';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { EmptyViewForNetwork } from 'src/ui/components/EmptyViewForNetwork';
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
  const merged = local
    .filter((tx) => backendHashes.has(tx.transaction.hash) === false)
    .concat(backend);
  return sortActions(merged);
}

function useMinedAndPendingAddressActions({ chain }: { chain: Chain | null }) {
  const { params } = useAddressParams();
  const { networks } = useNetworks();
  const isSupportedByBackend = chain
    ? networks?.isSupportedByBackend(chain)
    : true;
  const localActions = useLocalAddressTransactions(params);

  const { data: localAddressActions, ...localActionsQuery } = useQuery(
    ['pages/history', localActions, chain],
    async () => {
      const networks = await networksStore.load();
      const items = await Promise.all(
        localActions.map((transactionObject) =>
          toAddressTransaction(transactionObject, networks)
        )
      );
      if (chain) {
        return items.filter(
          (item) => item.transaction.chain === chain.toString()
        );
      } else {
        return items;
      }
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
      actions_chains:
        chain && isSupportedByBackend ? [chain.toString()] : undefined,
    },
    {
      limit: 30,
      listenForUpdates: false,
      paginatedCacheMode: 'first-page',
      enabled: isSupportedByBackend,
    }
  );

  return useMemo(() => {
    const backendItems = isSupportedByBackend && value ? value : [];
    return {
      value: localAddressActions
        ? mergeLocalAndBackendActions(localAddressActions, backendItems)
        : null,
      ...localActionsQuery,
      isLoading: actionsIsLoading || localActionsQuery.isLoading,
      hasMore: Boolean(isSupportedByBackend && hasNext),
      fetchMore,
    };
  }, [
    isSupportedByBackend,
    value,
    localAddressActions,
    localActionsQuery,
    actionsIsLoading,
    hasNext,
    fetchMore,
  ]);
}

export function HistoryList({
  chain: chainValue,
  onChainChange,
}: {
  chain: string;
  onChainChange: (value: string) => void;
}) {
  const chain = chainValue ? createChain(chainValue) : null;
  const {
    value: transactions,
    isLoading,
    fetchMore,
    hasMore,
  } = useMinedAndPendingAddressActions({ chain });

  if (isLoading && !transactions?.length) {
    return null;
  }

  if (!transactions) {
    return null;
  }

  const networkSelect = (
    <NetworkSelect
      type="overview"
      value={chainValue}
      onChange={onChainChange}
    />
  );
  if (!transactions.length) {
    return (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'end',
            paddingInline: 'var(--column-padding-inline)',
          }}
        >
          {networkSelect}
        </div>
        <EmptyViewForNetwork
          message="No transactions yet"
          chainValue={chainValue}
          onChainChange={onChainChange}
        />
      </>
    );
  }
  return (
    <ActionsList
      actions={transactions}
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={fetchMore}
      firstHeaderItemEnd={networkSelect}
    />
  );
}
