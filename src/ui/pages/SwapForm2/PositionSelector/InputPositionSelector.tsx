import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ComboboxProvider,
  Combobox,
  TabProvider,
  useTabContext,
} from '@ariakit/react';
import { normalizedContains } from 'normalized-contains';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { UIText } from 'src/ui/ui-kit/UIText';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useSearchQueryFungibles } from 'src/modules/zerion-api/hooks/useSearchQueryFungibles';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Input } from 'src/ui/ui-kit/Input';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import {
  ALL_NETWORKS_TAB_ID,
  NetworkChips,
  TabPanelWrapper,
} from 'src/ui/components/PositionSelector/NetworkChips';
import { TokenRow } from 'src/ui/components/PositionSelector/TokenRow';
import { TokenListSkeleton } from 'src/ui/components/PositionSelector/TokenListSkeleton';
import { useTopNetworks } from 'src/ui/components/PositionSelector/useTopNetworks';
import type { VirtualListItem } from 'src/ui/components/PositionSelector/VirtualizedTokenList';
import { VirtualizedTokenList } from 'src/ui/components/PositionSelector/VirtualizedTokenList';
import * as styles from 'src/ui/components/PositionSelector/styles.module.css';
import { NetworkSelect2 } from 'src/ui/components/NetworkSelect2';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';

const SearchCombobox = React.forwardRef<HTMLInputElement>(
  function SearchCombobox(_props, ref) {
    const tab = useTabContext();
    return (
      <div style={{ position: 'relative' }}>
        <SearchIcon
          role="presentation"
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 12,
            top: 10,
            width: 24,
            height: 24,
            color: 'var(--neutral-500)',
          }}
        />
        <Combobox
          ref={ref}
          autoSelect="always"
          placeholder="Search tokens"
          render={<Input style={{ paddingLeft: 40 }} />}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return;
            const activeId = tab?.getState().selectedId;
            const options = { activeId, focusLoop: false };
            const nextId = event.shiftKey
              ? tab?.previous(options)
              : tab?.next(options);
            if (!nextId) return;
            event.preventDefault();
            tab?.select(nextId);
          }}
        />
      </div>
    );
  }
);

/** A single list row, unifying held positions and searched (not-held) tokens. */
type RowItem = {
  fungible: Fungible;
  chainId: string;
  chainIconUrl: string;
  chainName: string;
  /** Fiat value / token quantity are only known for held positions. */
  fiatValue: number | null;
  tokenQuantity: string | null;
};

function positionKey(chainId: string, fungibleId: string): string {
  return `${chainId}|${fungibleId}`;
}

function resolveChain(networks: Networks, chainId: string) {
  const network = networks.getByNetworkId(createChain(chainId));
  return {
    chainIconUrl: network?.icon_url ?? '',
    chainName: network?.name ?? '',
  };
}

function heldRow(position: FungiblePosition): RowItem {
  return {
    fungible: position.fungible,
    chainId: position.chain.id,
    chainIconUrl: position.chain.iconUrl,
    chainName: position.chain.name,
    fiatValue: position.amount.value,
    tokenQuantity: position.amount.quantity,
  };
}

/**
 * Matches a fungible by contract address on any of its implementation chains,
 * so that pasting an address surfaces held rows and not only the backend
 * search results (which match addresses across all chains). Skipped for short
 * queries: single hex chars occur in almost every address and would defeat
 * the name/symbol filter.
 */
function matchesAddressQuery(fungible: Fungible, query: string): boolean {
  if (query.length < 4) {
    return false;
  }
  return (
    fungible.id.toLowerCase().includes(query) ||
    Object.values(fungible.implementations).some((impl) =>
      impl.address ? impl.address.toLowerCase().includes(query) : false
    )
  );
}

/**
 * Orders a fungible's implementation chains so the ones already surfaced as
 * network chips come first (in chip order), then the rest in backend order.
 */
function orderImplementationChains(
  implChains: string[],
  chipOrder: string[]
): string[] {
  const remaining = new Set(implChains);
  const ordered: string[] = [];
  for (const chainId of chipOrder) {
    if (remaining.has(chainId)) {
      ordered.push(chainId);
      remaining.delete(chainId);
    }
  }
  for (const chainId of implChains) {
    if (remaining.has(chainId)) {
      ordered.push(chainId);
      remaining.delete(chainId);
    }
  }
  return ordered;
}

/**
 * On top of holdings, a non-empty query also runs a backend token search
 * (`useSearchQueryFungibles`, mirroring the Receive selector). Matching tokens
 * the wallet does NOT hold are shown as zero-balance rows in a distinct
 * "Tokens not held in wallet" group below the holdings, so users can pick any
 * token (e.g. to simulate a swap). Each result expands into one row per
 * tradable implementation chain; the selected network chip narrows both the
 * holdings list and the search rows to that chain ("All" searches every chain).
 */
export function InputPositionSelector({
  positions,
  networks,
  defaultSelectedTab,
  onSelect,
  open,
  onClose,
}: {
  positions: FungiblePosition[];
  networks: Networks | null;
  defaultSelectedTab?: string | null;
  onSelect: (
    chainId: string,
    fungibleId: string,
    selectedTab: string | null
  ) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { currency } = useCurrency();
  const [searchValue, setSearchValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const isTradableChainId = useCallback(
    (chainId: string) => {
      if (!networks) return true;
      const network = networks.getByNetworkId(createChain(chainId));
      return Boolean(network?.supports_trading || network?.supports_bridging);
    },
    [networks]
  );

  const tradablePositions = useMemo(
    () => positions.filter((p) => isTradableChainId(p.chain.id)),
    [positions, isTradableChainId]
  );

  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(() => {
    const tabExists =
      defaultSelectedTab != null &&
      tradablePositions.some((p) => p.chain.id === defaultSelectedTab);
    return tabExists ? defaultSelectedTab : null;
  });
  const [pinnedFromDialog, setPinnedFromDialog] = useState<string | null>(null);
  const networkSelector = useDialog2();
  const comboboxRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const scrollChipIntoView = (chainId: string) => {
    const el = chipsRef.current?.querySelector<HTMLElement>(
      `[data-chain-id="${chainId}"]`
    );
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  };

  const debouncedSetQuery = useDebouncedCallback(
    useCallback((value: string) => setDebouncedQuery(value), []),
    300
  );

  useEffect(() => {
    if (!open) {
      setPinnedFromDialog(null);
      setSearchValue('');
      setDebouncedQuery('');
      debouncedSetQuery.cancel();
      return;
    }
    requestAnimationFrame(() => {
      scrollChipIntoView(selectedNetwork ?? ALL_NETWORKS_TAB_ID);
    });
    // Only run when dialog opens; reading selectedNetwork via closure is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const topNetworks = useTopNetworks(
    tradablePositions,
    selectedNetwork,
    pinnedFromDialog
  );

  const chipOrder = useMemo(
    () => topNetworks.map((n) => n.chainId),
    [topNetworks]
  );

  const showNetworkSelectorTrigger = topNetworks.length >= 4;

  const chainIdsInPositions = useMemo(
    () => new Set(tradablePositions.map((p) => p.chain.id)),
    [tradablePositions]
  );

  const chainDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    const chains: Record<string, true> = {};
    let totalValue = 0;
    for (const p of tradablePositions) {
      const value = p.amount.value || 0;
      distribution[p.chain.id] = (distribution[p.chain.id] || 0) + value;
      chains[p.chain.id] = true;
      totalValue += value;
    }
    return {
      positionsChainsDistribution: distribution,
      chains,
      totalValue,
    };
  }, [tradablePositions]);

  const filteredPositions = useMemo(() => {
    let result = tradablePositions;
    const networkFilter = selectedNetwork || null;
    if (networkFilter) {
      result = result.filter((p) => p.chain.id === networkFilter);
    }
    if (searchValue) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (p) =>
          normalizedContains(p.fungible.name.toLowerCase(), query) ||
          normalizedContains(p.fungible.symbol.toLowerCase(), query) ||
          matchesAddressQuery(p.fungible, query)
      );
    }
    return result.sort((a, b) => (b.amount.value || 0) - (a.amount.value || 0));
  }, [tradablePositions, selectedNetwork, searchValue]);

  const { fungibles: searchFungibles, queryData: searchQueryData } =
    useSearchQueryFungibles(
      { query: debouncedQuery, currency, limit: 50 },
      { enabled: Boolean(debouncedQuery) }
    );

  // Held (chain, fungible) pairs are shown in the holdings group above, so they
  // are dropped from the not-held search group to avoid duplicates.
  const heldKeys = useMemo(
    () =>
      new Set(
        tradablePositions.map((p) => positionKey(p.chain.id, p.fungible.id))
      ),
    [tradablePositions]
  );

  const notHeldRows = useMemo<RowItem[]>(() => {
    if (!searchFungibles || !networks || !debouncedQuery) {
      return [];
    }
    const seen = new Set<string>();
    const rows: RowItem[] = [];
    for (const fungible of searchFungibles) {
      const candidateChains = selectedNetwork
        ? fungible.implementations[selectedNetwork]
          ? [selectedNetwork]
          : []
        : orderImplementationChains(
            Object.keys(fungible.implementations),
            chipOrder
          );
      for (const chainId of candidateChains) {
        if (!isTradableChainId(chainId)) continue;
        const key = positionKey(chainId, fungible.id);
        if (heldKeys.has(key) || seen.has(key)) continue;
        seen.add(key);
        rows.push({
          fungible,
          chainId,
          ...resolveChain(networks, chainId),
          fiatValue: null,
          tokenQuantity: null,
        });
      }
    }
    return rows;
  }, [
    searchFungibles,
    networks,
    debouncedQuery,
    selectedNetwork,
    chipOrder,
    isTradableChainId,
    heldKeys,
  ]);

  const virtualItems = useMemo<VirtualListItem<RowItem>[]>(() => {
    const items: VirtualListItem<RowItem>[] = filteredPositions.map(
      (position) => ({
        kind: 'item',
        key: `held-${position.chain.id}-${position.fungible.id}`,
        data: heldRow(position),
      })
    );
    if (notHeldRows.length > 0) {
      items.push({
        kind: 'header',
        key: 'not-held',
        label: 'Tokens not held in wallet',
      });
      for (const row of notHeldRows) {
        items.push({
          kind: 'item',
          key: `search-${row.chainId}-${row.fungible.id}`,
          data: row,
        });
      }
    }
    return items;
  }, [filteredPositions, notHeldRows]);

  // While the backend search is loading its first page, show a skeleton instead
  // of the "no tokens found" empty state (holdings, if any, still render above).
  const searchLoading = Boolean(debouncedQuery) && searchQueryData.isLoading;

  return (
    <>
      <Dialog2 open={open} onClose={onClose} title="Pay with">
        {open && !networkSelector.open && showNetworkSelectorTrigger ? (
          <KeyboardShortcut
            combination="shift+right"
            availableDuringInputs={true}
            onKeyDown={networkSelector.openDialog}
          />
        ) : null}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}
        >
          <ComboboxProvider
            open={true}
            focusLoop={false}
            focusShift
            focusWrap="horizontal"
            resetValueOnHide
            setValue={(value) => {
              setSearchValue(value);
              debouncedSetQuery(value);
            }}
          >
            <TabProvider
              selectedId={selectedNetwork ?? ALL_NETWORKS_TAB_ID}
              setSelectedId={(id) => {
                if (!id) return;
                setSelectedNetwork(id === ALL_NETWORKS_TAB_ID ? null : id);
              }}
            >
              <div className={styles.panelRoot}>
                <div className={styles.fixedHeader}>
                  <div className={styles.searchWrapper}>
                    <SearchCombobox ref={comboboxRef} />
                  </div>
                  <NetworkChips
                    ref={chipsRef}
                    networks={topNetworks}
                    onOpenNetworkSelector={networkSelector.openDialog}
                    showNetworkSelectorTrigger={showNetworkSelectorTrigger}
                  />
                </div>
                <div className={styles.scrollArea}>
                  <TabPanelWrapper>
                    {virtualItems.length === 0 ? (
                      searchLoading ? (
                        <TokenListSkeleton count={5} />
                      ) : (
                        <div className={styles.emptyState}>
                          <UIText
                            kind="body/regular"
                            color="var(--neutral-500)"
                          >
                            No tokens found
                          </UIText>
                        </div>
                      )
                    ) : (
                      <>
                        <VirtualizedTokenList
                          items={virtualItems}
                          renderItem={(row) => (
                            <TokenRow
                              fungible={row.fungible}
                              chainId={row.chainId}
                              chainIconUrl={row.chainIconUrl}
                              chainName={row.chainName}
                              fiatValue={row.fiatValue}
                              tokenQuantity={row.tokenQuantity}
                              currency={currency}
                              onSelect={() => {
                                onSelect(
                                  row.chainId,
                                  row.fungible.id,
                                  selectedNetwork
                                );
                                onClose();
                              }}
                            />
                          )}
                          renderHeader={(label) => (
                            <div className={styles.sectionHeader}>
                              <UIText
                                kind="small/accent"
                                color="var(--neutral-500)"
                              >
                                {label}
                              </UIText>
                            </div>
                          )}
                        />
                        {searchLoading ? <TokenListSkeleton count={3} /> : null}
                      </>
                    )}
                  </TabPanelWrapper>
                </div>
              </div>
            </TabProvider>
          </ComboboxProvider>
        </div>
      </Dialog2>
      <NetworkSelect2
        open={networkSelector.open}
        onClose={networkSelector.closeDialog}
        value={selectedNetwork ?? NetworkSelectValue.All}
        chainDistribution={chainDistribution}
        showAllNetworksOption={true}
        filterPredicate={(network) =>
          chainIdsInPositions.has(network.id) &&
          (network.supports_trading || network.supports_bridging)
        }
        onSelect={(value) => {
          const isAll = value === NetworkSelectValue.All;
          const nextChainId = isAll ? null : value;
          setSelectedNetwork(nextChainId);
          setPinnedFromDialog(nextChainId);
          requestAnimationFrame(() => {
            scrollChipIntoView(nextChainId ?? ALL_NETWORKS_TAB_ID);
          });
          // Defer past Ariakit's focus restoration (which would otherwise
          // pull focus back to the globe trigger that opened this dialog).
          setTimeout(() => {
            comboboxRef.current?.focus();
          }, 300);
        }}
      />
    </>
  );
}
