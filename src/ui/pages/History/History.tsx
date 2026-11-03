import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import type { LocalAddressAction } from 'src/modules/ethereum/transactions/addressAction';
import type { ActionType } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { useQuery } from '@tanstack/react-query';
import {
  pendingTransactionToAddressAction,
  type LocalActionContentRequest,
} from 'src/modules/ethereum/transactions/addressAction/creators';
import SyncIcon from 'jsx:src/ui/assets/sync.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import dayjs from 'dayjs';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { hiddenPendingActionsStore } from 'src/ui/features/pending-transactions/hiddenPendingActions';
import {
  filterLocalByAssetTypes,
  hasContentFilter,
} from 'src/ui/features/pending-transactions/getLocalPendingActions';
import { withTransactionIdentity } from 'src/ui/features/pending-transactions/lookupTransactionIdentity';
import { useReadyClock } from 'src/ui/features/pending-transactions/useReadyClock';
import { reconcileBroadcastLocks } from 'src/ui/features/pending-transactions/broadcastLockStore';
import type { PendingAction } from 'src/modules/zerion-api/requests/wallet-get-actions';
import { ActionsList } from './ActionsList';
import { ActionSearch } from './ActionSearch';
import { isMatchForAllWords } from './matchSearcQuery';
import { getLocalActionSearchTerms } from './localActionContent';
import * as styles from './styles.module.css';
import { getHistoryActionsParams } from './getHistoryActionsParams';
import { mergeHistoryActions } from './mergeHistoryActions';
import { useHistoryFilterParams, HistoryFiltersButton } from './HistoryFilters';
import { PendingActionButtons } from './PendingActionButtons';

const HistoryRefetchContext = createContext<() => void>(() => {});

/** Re-fetches History's first page together with its pending lists. */
export function useRefetchHistory(): () => void {
  return useContext(HistoryRefetchContext);
}

function PendingRowActions({
  item,
  nowMs,
}: {
  item: PendingAction;
  nowMs: number;
}) {
  const refetchHistory = useRefetchHistory();
  return (
    <PendingActionButtons
      item={item}
      nowMs={nowMs}
      placement="row"
      onSettled={refetchHistory}
    />
  );
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
  const { params, singleAddress } = useAddressParams();
  const { networks, loadNetworkByChainId } = useNetworks();
  const isSupportedByBackend = chain
    ? networks?.supports('actions', chain)
    : true;
  const localActions = useLocalAddressTransactions(params);
  const source = useHttpClientSource();
  const { currency } = useCurrency();

  // Building local actions makes no asset requests: rows resolve their own
  // assets once they scroll into view (see LocalActionItem). Filters apply
  // below in a memo, so typing a search query or switching a filter does not
  // rebuild anything.
  // `source` is part of the key because the networks resolver behind
  // `loadNetworkByChainId` swaps with testnet mode.
  const { data: localItems, ...localActionsQuery } = useQuery({
    queryKey: ['pages/history', localActions, currency, source],
    queryFn: async () => {
      // One item that fails to build (e.g. its chain metadata cannot be
      // fetched) is dropped from the list; it must not take the whole
      // History view down.
      const results = await Promise.allSettled(
        localActions.map((transactionObject) =>
          pendingTransactionToAddressAction(
            transactionObject,
            loadNetworkByChainId,
            currency
          )
        )
      );
      return results.flatMap((result) => {
        if (result.status === 'fulfilled') {
          return [result.value];
        }
        console.error('Failed to build local action', result.reason); // eslint-disable-line no-console
        return [];
      });
    },
    useErrorBoundary: false,
  });

  const localAddressActions = useMemo(() => {
    if (!localItems) {
      return null;
    }
    let items = localItems;
    if (chain) {
      items = items.filter(
        ({ addressAction }) =>
          addressAction.transaction?.chain.id === chain.toString()
      );
    }
    if (searchQuery) {
      items = items.filter(({ addressAction, contentRequest }) =>
        isMatchForAllWords(
          searchQuery,
          addressAction,
          contentRequest
            ? getLocalActionSearchTerms(contentRequest, source)
            : undefined
        )
      );
    }
    if (startDate) {
      items = items.filter(({ addressAction }) =>
        dayjs(addressAction.timestamp).isBefore(dayjs(startDate))
      );
    }
    if (actionTypes?.length) {
      items = items.filter(
        ({ addressAction }) =>
          actionTypes.includes(addressAction.type.value) ||
          addressAction.acts?.some((act) =>
            actionTypes.includes(act.type.value)
          )
      );
    }
    return filterLocalByAssetTypes(
      items.map((item) => item.addressAction),
      assetTypes
    ).map(withTransactionIdentity);
  }, [
    localItems,
    chain,
    searchQuery,
    source,
    startDate,
    actionTypes,
    assetTypes,
  ]);

  const contentRequests = useMemo(() => {
    const map = new Map<string, LocalActionContentRequest>();
    for (const { addressAction, contentRequest } of localItems ?? []) {
      if (contentRequest) {
        map.set(addressAction.id, contentRequest);
      }
    }
    return map;
  }, [localItems]);

  const { data: walletGroup, isFetched: isWalletGroupFetched } = useQuery({
    queryKey: ['getWalletGroupByAddress', singleAddress],
    queryFn: () => getWalletGroupByAddress(singleAddress),
    enabled: Boolean(singleAddress),
    useErrorBoundary: false,
  });
  const isOwnWallet = Boolean(
    walletGroup && !isReadonlyContainer(walletGroup.walletContainer)
  );
  const backendChain =
    chain && isSupportedByBackend ? chain.toString() : undefined;
  const requestParams = useMemo(
    () =>
      getHistoryActionsParams({
        address: params.address,
        currency,
        chain: backendChain,
        searchQuery,
        startDate,
        actionTypes,
        assetTypes,
        isOwnWallet,
      }),
    [
      params.address,
      currency,
      backendChain,
      searchQuery,
      startDate,
      actionTypes,
      assetTypes,
      isOwnWallet,
    ]
  );
  const hiddenIds = useStore(hiddenPendingActionsStore);

  const [pendingRows, setPendingRows] = useState<LocalAddressAction[]>([]);
  const {
    actions,
    pending,
    unsigned,
    pendingListsAvailable,
    queryData,
    refetch,
  } = useWalletActions(
    requestParams,
    { source },
    {
      enabled: isSupportedByBackend && isWalletGroupFetched,
      localPending: pendingRows,
    }
  );

  const listsUnfiltered =
    !requestParams.chain && !hasContentFilter(requestParams);
  useEffect(() => {
    if (listsUnfiltered && pendingListsAvailable && pending && unsigned) {
      reconcileBroadcastLocks({ pending, unsigned });
    }
  }, [listsUnfiltered, pendingListsAvailable, pending, unsigned]);

  const merged = useMemo(() => {
    if (!localAddressActions) {
      return null;
    }
    const backendFailed = !isSupportedByBackend || queryData.isError;
    return mergeHistoryActions({
      local: localAddressActions,
      actions: backendFailed ? [] : actions,
      pending: backendFailed ? [] : pending ?? [],
      unsigned: backendFailed ? [] : unsigned ?? [],
      hiddenIds,
      filters: { chain: chain?.toString(), searchQuery, actionTypes },
      contentFiltered: hasContentFilter(requestParams),
    });
  }, [
    localAddressActions,
    isSupportedByBackend,
    queryData.isError,
    actions,
    pending,
    unsigned,
    hiddenIds,
    chain,
    searchQuery,
    actionTypes,
    requestParams,
  ]);

  const localPendingRows = useMemo(
    () =>
      merged?.pending.flatMap((entry) =>
        entry.kind === 'local' ? [entry.action] : []
      ) ?? [],
    [merged]
  );
  useEffect(() => {
    setPendingRows((current) =>
      current.map((row) => row.id).join() ===
      localPendingRows.map((row) => row.id).join()
        ? current
        : localPendingRows
    );
  }, [localPendingRows]);

  return useMemo(() => {
    return {
      actions: merged?.history ?? null,
      pendingEntries: merged?.pending ?? [],
      contentRequests,
      ...localActionsQuery,
      isLoading:
        queryData.isLoading ||
        queryData.isFetching ||
        localActionsQuery.isLoading,
      queryData,
      refetch,
    };
  }, [merged, contentRequests, localActionsQuery, queryData, refetch]);
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
  const {
    actions,
    pendingEntries,
    contentRequests,
    isLoading,
    queryData,
    refetch,
  } = useMinedAndPendingAddressActions({
    chain,
    searchQuery,
    startDate: searchParams.date,
    actionTypes: actionTypes.length ? actionTypes : undefined,
    assetTypes: assetTypes.length ? assetTypes : undefined,
  });

  const unsignedEntries = useMemo(
    () =>
      pendingEntries.flatMap((entry) =>
        entry.kind === 'remote' && entry.item.status === 'unsigned'
          ? [entry.item]
          : []
      ),
    [pendingEntries]
  );
  const nowMs = useReadyClock(unsignedEntries);

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

  if (!actions?.length && !pendingEntries.length) {
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
      <HistoryRefetchContext.Provider value={refetch}>
        <ActionsList
          actions={actions ?? []}
          pendingEntries={pendingEntries}
          nowMs={nowMs}
          renderPendingActions={(item) => (
            <PendingRowActions item={item} nowMs={nowMs} />
          )}
          contentRequests={contentRequests}
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
      </HistoryRefetchContext.Provider>
    </>
  );
}
