import React, { useCallback, useMemo, useState } from 'react';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import * as helperStyles from 'src/ui/style/helpers.module.css';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { CenteredFillViewportView } from 'src/ui/components/FillView/FillView';
import { useStore } from '@store-unit/react';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { UIText } from 'src/ui/ui-kit/UIText';
import {
  getCurrentTabsOffset,
  getGrownTabMaxHeight,
  offsetValues,
} from 'src/ui/pages/Overview/getTabsOffset';
import { getAddressType } from 'src/shared/wallet/classifiers';
import { useWalletActions } from 'src/modules/zerion-api/hooks/useWalletActions';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';
import type { AnyAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type {
  ActionType,
  AddressAction,
} from 'src/modules/zerion-api/requests/wallet-get-actions';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { useDefiSdkClient } from 'src/modules/defi-sdk/useDefiSdkClient';
import { hashQueryKey, useQuery } from '@tanstack/react-query';
import { pendingTransactionToAddressAction } from 'src/modules/ethereum/transactions/addressAction/creators';
import { Client } from 'defi-sdk';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import dayjs from 'dayjs';
import { ActionsList } from './ActionsList';
import { ActionSearch } from './ActionSearch';
import { isMatchForAllWords } from './matchSearcQuery';
import * as styles from './styles.module.css';
import { getAddressActionsCursor } from './getAddressActionCursor';
import { useHistoryFilterParams, HistoryFiltersButton } from './HistoryFilters';

function sortActions<T extends { timestamp?: number }>(actions: T[]) {
  return actions.sort((a, b) => {
    const aDate = a.timestamp || Date.now();
    const bDate = b.timestamp || Date.now();
    return bDate - aDate;
  });
}

function mergeLocalAndBackendActions(
  local: AnyAddressAction[],
  backend: AddressAction[],
  hasMoreBackendActions: boolean
) {
  const backendHashes = new Set(
    backend.flatMap(
      (tx) =>
        tx.transaction?.hash || tx.acts?.map((act) => act.transaction.hash)
    )
  );

  const lastBackendActionDatetime = backend.at(-1)?.timestamp;
  const lastBackendTimestamp =
    lastBackendActionDatetime && hasMoreBackendActions
      ? new Date(lastBackendActionDatetime).getTime()
      : 0;

  const merged = local
    .filter(
      (tx) =>
        tx.transaction?.hash &&
        backendHashes.has(tx.transaction.hash) === false &&
        !tx.acts?.some(
          (act) =>
            act.transaction.hash && backendHashes.has(act.transaction.hash)
        ) &&
        tx.timestamp >= lastBackendTimestamp
    )
    .concat(backend);
  return sortActions(merged);
}

function useMinedAndPendingAddressActions({
  chain,
  searchQuery,
  startDate,
  actionTypes,
  assetTypes,
}: {
  chain: Chain | null;
  searchQuery?: string;
  startDate?: string;
  actionTypes?: ActionType[];
  assetTypes?: ('fungible' | 'nft')[];
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
    queryKey: [
      'pages/history',
      localActions,
      chain,
      searchQuery,
      client,
      startDate,
      actionTypes,
      actionTypes?.length,
      assetTypes?.length,
      assetTypes?.[0],
    ],
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
          (item) => item.transaction?.chain.id === chain.toString()
        );
      }
      if (searchQuery) {
        items = items.filter((item) => isMatchForAllWords(searchQuery, item));
      }
      if (startDate) {
        items = items.filter((item) =>
          dayjs(item.timestamp).isBefore(dayjs(startDate))
        );
      }
      if (actionTypes?.length) {
        items = items.filter(
          (item) =>
            actionTypes.includes(item.type.value) ||
            item.acts?.some((act) => actionTypes.includes(act.type.value))
        );
      }
      if (assetTypes?.length === 1 && assetTypes?.[0] === 'nft') {
        items = items.filter(() => false);
      }
      return items;
    },
    useErrorBoundary: true,
  });

  const { actions, queryData, refetch } = useWalletActions(
    {
      addresses: [params.address],
      currency,
      chain: chain && isSupportedByBackend ? chain.toString() : undefined,
      searchQuery,
      cursor: startDate ? getAddressActionsCursor(startDate) : undefined,
      actionTypes: actionTypes?.length ? actionTypes : undefined,
      assetTypes: assetTypes?.length ? assetTypes : undefined,
      limit: 10,
    },
    { source: useHttpClientSource() },
    { enabled: isSupportedByBackend }
  );

  return useMemo(() => {
    const backendItems = isSupportedByBackend && actions ? actions : [];
    const hasMore = Boolean(isSupportedByBackend && queryData.hasNextPage);
    return {
      actions: localAddressActions
        ? mergeLocalAndBackendActions(
            localAddressActions,
            backendItems,
            hasMore
          )
        : null,
      ...localActionsQuery,
      isLoading:
        queryData.isLoading ||
        queryData.isFetching ||
        localActionsQuery.isLoading,
      queryData,
      refetch,
    };
  }, [
    isSupportedByBackend,
    actions,
    localAddressActions,
    localActionsQuery,
    queryData,
    refetch,
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
    <VStack
      gap={6}
      style={{ textAlign: 'center', padding: 20, paddingBlock: 80 }}
    >
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
    </VStack>
  );
}

function formatDate(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function HistoryList({
  selectedChain,
  onChainChange,
}: {
  selectedChain: string | null;
  onChainChange: (value: string | null) => void;
}) {
  const { singleAddress: address } = useAddressParams();
  const {
    searchParams,
    setSearchParams,
    actionTypes,
    actionTypeKeys,
    assetTypes,
    assetTypeParam,
    hasActiveFilters,
  } = useHistoryFilterParams();
  const offsetValuesState = useStore(offsetValues);
  const addressType = getAddressType(address);

  const chainValue = selectedChain || NetworkSelectValue.All;
  const chain =
    chainValue && chainValue !== NetworkSelectValue.All
      ? createChain(chainValue)
      : null;

  const [searchQuery, setSearchQuery] = useState<string | undefined>();
  const { actions, isLoading, queryData, refetch } =
    useMinedAndPendingAddressActions({
      chain,
      searchQuery,
      startDate: searchParams.date,
      actionTypes: actionTypes.length ? actionTypes : undefined,
      assetTypes: assetTypes.length ? assetTypes : undefined,
    });

  const handleActionTypesChange = useCallback(
    (keys: string[]) => {
      setSearchParams((current) => ({
        ...current,
        actionTypes: keys.length ? keys.join(',') : undefined,
      }));
    },
    [setSearchParams]
  );

  const handleAssetTypeChange = useCallback(
    (value: string) => {
      setSearchParams((current) => ({
        ...current,
        assetTypes: value === 'all' ? undefined : value,
      }));
    },
    [setSearchParams]
  );

  const handleDateChange = useCallback(
    (date: Date | null) => {
      setSearchParams((current) => ({
        ...current,
        date: date ? formatDate(date) : undefined,
      }));
    },
    [setSearchParams]
  );

  const handleResetAll = useCallback(() => {
    setSearchParams((current) => {
      const next = { ...current };
      delete next.actionTypes;
      delete next.assetTypes;
      delete next.date;
      delete next.chain;
      return next;
    });
  }, [setSearchParams]);

  const actionFilters = (
    <div style={{ paddingInline: 16 }}>
      <HStack
        gap={8}
        alignItems="center"
        style={{ gridTemplateColumns: '1fr auto auto' }}
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
        <HistoryFiltersButton
          hasActiveFilters={hasActiveFilters}
          selectedChain={selectedChain}
          onChainChange={onChainChange}
          addressType={addressType}
          date={searchParams.date}
          onDateChange={handleDateChange}
          actionTypeKeys={actionTypeKeys}
          assetTypeParam={assetTypeParam}
          onActionTypesChange={handleActionTypesChange}
          onAssetTypeChange={handleAssetTypeChange}
          onResetAll={handleResetAll}
        />
        <Button
          onClick={refetch}
          size={40}
          kind="neutral"
          style={{ paddingInline: 8 }}
          disabled={isLoading}
          title="Reload History (⌃R)"
        >
          <SyncIcon
            style={{
              display: 'block',
              width: 24,
              height: 24,
              transition: 'transform 0.5s linear',
            }}
            className={isLoading ? styles.updateIconLoading : undefined}
          />
        </Button>
        <KeyboardShortcut
          combination="cmd+r"
          onKeyDown={() => {
            if (!isLoading) {
              refetch();
            }
          }}
        />
        <KeyboardShortcut
          combination="ctrl+r"
          onKeyDown={() => {
            if (!isLoading) {
              refetch();
            }
          }}
        />
      </HStack>
    </div>
  );

  if (!actions?.length) {
    return (
      <CenteredFillViewportView
        maxHeight={getGrownTabMaxHeight(offsetValuesState)}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          {actionFilters}
        </div>
        {isLoading ? (
          <ViewLoading kind="network" />
        ) : (
          <HistoryEmptyView
            hasFilters={Boolean(
              searchQuery ||
                selectedChain ||
                hasActiveFilters ||
                searchParams.date
            )}
            onReset={() => {
              setSearchQuery(undefined);
              handleResetAll();
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
        actions={actions}
        hasMore={Boolean(queryData.hasNextPage)}
        isLoading={isLoading}
        onLoadMore={queryData.fetchNextPage}
        targetDate={searchParams.date || null}
        onChangeDate={(date) =>
          setSearchParams((state) => ({
            ...state,
            date: date ? formatDate(date) : undefined,
          }))
        }
      />
    </>
  );
}
