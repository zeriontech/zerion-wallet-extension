import React, { useMemo, useState } from 'react';
import type { AddressAction } from 'defi-sdk';
import { Client, useAddressActions } from 'defi-sdk';
import { hashQueryKey, useQuery } from '@tanstack/react-query';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { pendingTransactionToAddressAction } from 'src/modules/ethereum/transactions/addressAction/creators';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { useStore } from '@store-unit/react';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { EmptyView } from 'src/ui/components/EmptyView';
import { NetworkBalance } from 'src/ui/pages/Overview/Positions/NetworkBalance';
import {
  getCurrentTabsOffset,
  getGrownTabMaxHeight,
  offsetValues,
} from 'src/ui/pages/Overview/getTabsOffset';
import { ActionsList } from './ActionsList';
import { ActionSearch } from './ActionSearch';
import { isMatchForAllWords } from './matchSearcQuery';

function sortActions<T extends { datetime?: string }>(actions: T[]) {
  return actions.sort((a, b) => {
    const aDate = a.datetime ? new Date(a.datetime).getTime() : Date.now();
    const bDate = b.datetime ? new Date(b.datetime).getTime() : Date.now();
    return bDate - aDate;
  });
}

function mergeLocalAndBackendActions(
  local: AnyAddressAction[],
  backend: AddressAction[],
  hasMoreBackendActions: boolean
) {
  const backendHashes = new Set(backend.map((tx) => tx.transaction.hash));

  const lastBackendActionDatetime = backend.at(-1)?.datetime;
  const lastBackendTimestamp =
    lastBackendActionDatetime && hasMoreBackendActions
      ? new Date(lastBackendActionDatetime).getTime()
      : 0;

  const merged = local
    .filter(
      (tx) =>
        backendHashes.has(tx.transaction.hash) === false &&
        new Date(tx.datetime).getTime() >= lastBackendTimestamp
    )
    .concat(backend);
  return sortActions(merged);
}

function useMinedAndPendingAddressActions({
  chain,
  searchQuery,
}: {
  chain: Chain | null;
  searchQuery?: string;
}) {
  const { params } = useAddressParams();
  const { networks, loadNetworkByChainId } = useNetworks();
  const isSupportedByBackend = chain
    ? networks?.supports('actions', chain)
    : true;
  const localActions = useLocalAddressTransactions(params);
  const client = useDefiSdkClient();
  const { currency } = useCurrency();

  const { data: localAddressActions, ...localActionsQuery } = useQuery({
    // NOTE: for some reason, eslint doesn't warn about missing client. Report to GH?
    queryKey: ['pages/history', localActions, chain, searchQuery, client],
    queryKeyHashFn: (queryKey) => {
      const key = queryKey.map((x) => (x instanceof Client ? x.url : x));
      return hashQueryKey(key);
    },
    queryFn: async () => {
      let items = await Promise.all(
        localActions.map((transactionObject) =>
          pendingTransactionToAddressAction(
            transactionObject,
            loadNetworkByChainId,
            currency,
            client
          )
        )
      );
      if (chain) {
        items = items.filter(
          (item) => item.transaction.chain === chain.toString()
        );
      }
      if (searchQuery) {
        items = items.filter((item) => isMatchForAllWords(searchQuery, item));
      }
      return items;
    },
    useErrorBoundary: true,
  });

  const {
    value,
    isFetching: actionsIsLoading,
    hasNext,
    fetchMore,
  } = useAddressActions(
    {
      ...params,
      currency,
      actions_chains:
        chain && isSupportedByBackend ? [chain.toString()] : undefined,
      actions_search_query: searchQuery,
    },
    {
      limit: 30,
      listenForUpdates: true,
      paginatedCacheMode: 'first-page',
      enabled: isSupportedByBackend,
    }
  );

  return useMemo(() => {
    const backendItems = isSupportedByBackend && value ? value : [];
    const hasMore = Boolean(isSupportedByBackend && hasNext);
    return {
      value: localAddressActions
        ? mergeLocalAndBackendActions(
            localAddressActions,
            backendItems,
            hasMore
          )
        : null,
      ...localActionsQuery,
      isLoading: actionsIsLoading || localActionsQuery.isLoading,
      hasMore,
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

function HistoryEmptyView({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset(): void;
}) {
  return (
    <EmptyView>
      <VStack gap={4}>
        <div>No transactions</div>
        {hasFilters ? (
          <UnstyledButton
            onClick={onReset}
            style={{ color: 'var(--primary)' }}
            className={helperStyles.hoverUnderline}
          >
            Reset all filters
          </UnstyledButton>
        ) : null}
      </VStack>
    </EmptyView>
  );
}

export function HistoryList({
  dappChain,
  selectedChain,
  onChainChange,
}: {
  dappChain: string | null;
  selectedChain: string | null;
  onChainChange: (value: string | null) => void;
}) {
  const offsetValuesState = useStore(offsetValues);

  const chainValue = selectedChain || dappChain || NetworkSelectValue.All;
  const chain =
    chainValue && chainValue !== NetworkSelectValue.All
      ? createChain(chainValue)
      : null;

  const [searchQuery, setSearchQuery] = useState<string | undefined>();
  const {
    value: transactions,
    isLoading,
    fetchMore,
    hasMore,
  } = useMinedAndPendingAddressActions({ chain, searchQuery });

  const actionFilters = (
    <div style={{ paddingInline: 16 }}>
      <VStack gap={8}>
        <NetworkBalance
          dappChain={dappChain}
          selectedChain={selectedChain}
          onChange={onChainChange}
          value={null}
        />
        <ActionSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onFocus={() => {
            window.scrollTo({
              behavior: 'smooth',
              top: getCurrentTabsOffset(offsetValuesState),
            });
          }}
        />
      </VStack>
    </div>
  );

  if (!transactions?.length) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        <div style={{ position: 'absolute', width: '100%' }}>
          {actionFilters}
        </div>
        {isLoading ? (
          <ViewLoading kind="network" />
        ) : (
          <HistoryEmptyView
            hasFilters={Boolean(searchQuery || selectedChain)}
            onReset={() => {
              setSearchQuery(undefined);
              onChainChange(null);
            }}
          />
        )}
      </CenteredFillViewportView>
    );
  }

  return (
    <>
      {actionFilters}
      <Spacer height={16} />
      <ActionsList
        actions={transactions}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={fetchMore}
      />
    </>
  );
}
