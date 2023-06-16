import React, { useMemo, useState } from 'react';
import type { AddressAction } from 'defi-sdk';
import { useAddressActions } from 'defi-sdk';
import { useQuery } from '@tanstack/react-query';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { NetworkSelect } from 'src/ui/pages/Networks/NetworkSelect';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { StretchyFillView } from 'src/ui/components/FillView/FillView';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { UIText } from 'src/ui/ui-kit/UIText';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { pendingTransactionToAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { STRETCHY_VIEW_HEIGHT } from './constants';
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
  backend: AddressAction[]
) {
  const backendHashes = new Set(backend.map((tx) => tx.transaction.hash));
  const merged = local
    .filter((tx) => backendHashes.has(tx.transaction.hash) === false)
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
  const { networks } = useNetworks();
  const isSupportedByBackend = chain
    ? networks?.isSupportedByBackend(chain)
    : true;
  const localActions = useLocalAddressTransactions(params);

  const { data: localAddressActions, ...localActionsQuery } = useQuery({
    queryKey: ['pages/history', localActions, chain, networks, searchQuery],
    queryFn: async () => {
      if (!networks) {
        return null;
      }
      let items = await Promise.all(
        localActions.map((transactionObject) =>
          pendingTransactionToAddressAction(transactionObject, networks)
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
    enabled: Boolean(networks),
    useErrorBoundary: true,
  });

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
      actions_search_query: searchQuery,
    },
    {
      limit: 30,
      listenForUpdates: false,
      paginatedCacheMode: 'first-page',
      enabled: isSupportedByBackend,
      keepStaleData: true,
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

function EmptyView({ onReset }: { onReset(): void }) {
  return (
    <VStack gap={6} style={{ textAlign: 'center' }}>
      <UIText kind="headline/hero">🥺</UIText>
      <UIText kind="small/accent" color="var(--neutral-500)">
        <VStack gap={4}>
          <div>No transactions</div>
          <UnstyledButton
            onClick={onReset}
            style={{ color: 'var(--primary)' }}
            className={helperStyles.hoverUnderline}
          >
            Reset all filters
          </UnstyledButton>
        </VStack>
      </UIText>
      <Spacer height={10} />
    </VStack>
  );
}

export function HistoryList({
  chain: chainValue,
  onChainChange,
}: {
  chain: string;
  onChainChange: (value: string) => void;
}) {
  const chain = chainValue ? createChain(chainValue) : null;
  const [searchQuery, setSearchQuery] = useState<string | undefined>();
  const {
    value: transactions,
    isLoading,
    fetchMore,
    hasMore,
  } = useMinedAndPendingAddressActions({ chain, searchQuery });

  const actionFilters = (
    <HStack
      gap={16}
      alignItems="center"
      style={{ paddingInline: 16, gridTemplateColumns: '1fr auto' }}
    >
      <ActionSearch
        value={searchQuery}
        onChange={setSearchQuery}
        onFocus={(e) => {
          const yOffset = -108;
          const scrollDistance =
            e.target.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ behavior: 'smooth', top: scrollDistance });
        }}
      />
      <NetworkSelect
        type="overview"
        value={chainValue}
        onChange={onChainChange}
      />
    </HStack>
  );

  return (
    <>
      {actionFilters}
      <Spacer height={16} />
      {transactions?.length ? (
        <ActionsList
          actions={transactions}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={fetchMore}
        />
      ) : (
        <StretchyFillView maxHeight={STRETCHY_VIEW_HEIGHT}>
          {!isLoading ? (
            <DelayedRender delay={300}>
              <EmptyView
                onReset={() => {
                  setSearchQuery(undefined);
                  onChainChange(NetworkSelectValue.All);
                }}
              />
            </DelayedRender>
          ) : (
            <DelayedRender delay={300}>
              <ViewLoading kind="network" />
            </DelayedRender>
          )}
        </StretchyFillView>
      )}
    </>
  );
}
