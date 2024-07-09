import React, { useMemo, useState } from 'react';
import type { AddressAction } from 'defi-sdk';
import { Client, useAddressActions } from 'defi-sdk';
import { hashQueryKey, useQuery } from '@tanstack/react-query';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { NetworkSelect } from 'src/ui/pages/Networks/NetworkSelect';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { UIText } from 'src/ui/ui-kit/UIText';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { pendingTransactionToAddressAction } from 'src/modules/ethereum/transactions/addressAction/creators';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import AllNetworksIcon from 'jsx:src/ui/assets/network.svg';
import CloseIcon from 'jsx:src/ui/assets/close_solid.svg';
import { Button } from 'src/ui/ui-kit/Button';
import { useStore } from '@store-unit/react';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { useCurrency } from 'src/modules/currency/useCurrency';
import {
  getCurrentTabsOffset,
  getGrownTabMaxHeight,
  offsetValues,
} from '../Overview/getTabsOffset';
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
            client,
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

function EmptyView({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset(): void;
}) {
  return (
    <VStack gap={6} style={{ textAlign: 'center' }}>
      <UIText kind="headline/hero">🥺</UIText>
      <UIText kind="small/accent" color="var(--neutral-500)">
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
      </UIText>
      <Spacer height={10} />
    </VStack>
  );
}

export function HistoryList() {
  const { networks } = useNetworks();
  const offsetValuesState = useStore(offsetValues);
  const [filterChain, setFilterChain] = useState<string | null>(null);
  const chain =
    filterChain && filterChain !== NetworkSelectValue.All
      ? createChain(filterChain)
      : null;

  const chainValue = filterChain || NetworkSelectValue.All;

  const [searchQuery, setSearchQuery] = useState<string | undefined>();
  const {
    value: transactions,
    isLoading,
    fetchMore,
    hasMore,
  } = useMinedAndPendingAddressActions({ chain, searchQuery });

  const filterNetwork =
    chainValue === NetworkSelectValue.All
      ? null
      : networks?.getNetworkByName(createChain(chainValue));

  const actionFilters = (
    <VStack gap={8}>
      <HStack
        gap={8}
        alignItems="center"
        style={{
          paddingInline: 16,
          gridTemplateColumns: '1fr auto',
        }}
      >
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
        <NetworkSelect
          value={chainValue}
          onChange={setFilterChain}
          renderButton={({ value, openDialog }) => {
            return (
              <Button
                kind="ghost"
                size={36}
                onClick={openDialog}
                style={{ padding: 8 }}
              >
                {!filterNetwork || value === NetworkSelectValue.All ? (
                  <AllNetworksIcon
                    style={{ width: 20, height: 20 }}
                    role="presentation"
                  />
                ) : (
                  <NetworkIcon
                    size={20}
                    src={filterNetwork.icon_url}
                    name={filterNetwork.name}
                  />
                )}
              </Button>
            );
          }}
        />
      </HStack>
      {filterNetwork ? (
        <div style={{ paddingInline: 16 }}>
          <Button
            kind="regular"
            size={32}
            style={{
              borderWidth: 2,
              borderColor: 'var(--neutral-200)',
              paddingInline: '12px 8px',
            }}
            onClick={() => setFilterChain(null)}
          >
            <HStack gap={4} alignItems="center">
              <UIText kind="small/accent">{filterNetwork.name}</UIText>
              <CloseIcon
                style={{ width: 16, height: 16, color: 'var(--black)' }}
              />
            </HStack>
          </Button>
        </div>
      ) : null}
    </VStack>
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
          <EmptyView
            hasFilters={Boolean(searchQuery || filterChain)}
            onReset={() => {
              setSearchQuery(undefined);
              setFilterChain(null);
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
