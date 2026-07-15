import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ComboboxProvider,
  Combobox,
  TabProvider,
  useTabContext,
} from '@ariakit/react';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { UIText } from 'src/ui/ui-kit/UIText';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useReceiveFungibles } from 'src/modules/zerion-api/hooks/useReceiveFungibles';
import { useSearchQueryFungibles } from 'src/modules/zerion-api/hooks/useSearchQueryFungibles';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Input } from 'src/ui/ui-kit/Input';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import {
  NetworkChips,
  TabPanelWrapper,
} from 'src/ui/components/PositionSelector/NetworkChips';
import { TokenRow } from 'src/ui/components/PositionSelector/TokenRow';
import { TokenListSkeleton } from 'src/ui/components/PositionSelector/TokenListSkeleton';
import { useTopNetworks } from 'src/ui/components/PositionSelector/useTopNetworks';
import type { TopNetworksEntry } from 'src/ui/components/PositionSelector/useTopNetworks';
import type { VirtualListItem } from 'src/ui/components/PositionSelector/VirtualizedTokenList';
import { VirtualizedTokenList } from 'src/ui/components/PositionSelector/VirtualizedTokenList';
import * as styles from 'src/ui/components/PositionSelector/styles.module.css';
import { NetworkSelect2 } from 'src/ui/components/NetworkSelect2';

const SOLANA_CHAIN_ID = 'solana';
const ETHEREUM_CHAIN_ID = 'ethereum';

/**
 * Padding pool used when the user's positions don't cover enough chains to
 * fill the receive-selector tab strip. Order is the priority in which we
 * top up; the first entries are picked first. `solana` is omitted because
 * it is always pinned as the leftmost chip via `pinnedFirstChainId`.
 */
const RECEIVE_PAD_CHAIN_IDS = [
  'ethereum',
  'base',
  'arbitrum',
  'optimism',
  'polygon',
  'binance-smart-chain',
  'avalanche',
  'zora',
  'linea',
  'zksync-era',
] as const;

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

type RowItem = {
  fungible: Fungible;
  chainId: string;
  chainIconUrl: string;
  chainName: string;
};

function resolveChain(networks: Networks, chainId: string) {
  if (!chainId) {
    return { chainIconUrl: '', chainName: '' };
  }
  const network = networks.getByNetworkId(createChain(chainId));
  return {
    chainIconUrl: network?.icon_url ?? '',
    chainName: network?.name ?? '',
  };
}

function positionKey(chainId: string, fungibleId: string): string {
  return `${chainId}|${fungibleId}`;
}

function renderFungibleRow(
  { fungible, chainId, chainIconUrl, chainName }: RowItem,
  currency: string,
  positionLookup: Map<string, FungiblePosition>,
  onSelect: (fungible: Fungible, chainId: string) => void
) {
  const match = positionLookup.get(positionKey(chainId, fungible.id));
  return (
    <TokenRow
      fungible={fungible}
      chainId={chainId}
      chainIconUrl={chainIconUrl}
      chainName={chainName}
      fiatValue={match?.amount.value ?? null}
      tokenQuantity={match?.amount.quantity ?? null}
      currency={currency}
      onSelect={() => onSelect(fungible, chainId)}
    />
  );
}

function ReceiveFungiblesList({
  chain,
  currency,
  networks,
  positionLookup,
  onSelect,
}: {
  chain: string;
  currency: string;
  networks: Networks;
  positionLookup: Map<string, FungiblePosition>;
  onSelect: (fungible: Fungible, chainId: string) => void;
}) {
  const { data } = useReceiveFungibles({
    chain,
    currency,
  });

  const selectChain = (fungible: Fungible) => {
    if (fungible.implementations[chain]) {
      return chain;
    }
    const chains = Object.keys(fungible.implementations);
    return chains[0] || chain;
  };

  const virtualItems = useMemo<VirtualListItem<RowItem>[]>(() => {
    if (!data) {
      return [];
    }
    const { popular, others } = data.data;
    const result: VirtualListItem<RowItem>[] = [];
    const toRow = (fungible: Fungible): RowItem => {
      const chainId = selectChain(fungible);
      return { fungible, chainId, ...resolveChain(networks, chainId) };
    };
    if (popular.length > 0) {
      result.push({ kind: 'header', key: 'popular', label: 'Popular' });
      for (const fungible of popular) {
        result.push({
          kind: 'item',
          key: `popular-${fungible.id}`,
          data: toRow(fungible),
        });
      }
    }
    if (others.length > 0) {
      result.push({ kind: 'header', key: 'others', label: 'Others' });
      for (const fungible of others) {
        result.push({
          kind: 'item',
          key: `others-${fungible.id}`,
          data: toRow(fungible),
        });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, chain, networks]);

  if (!data) {
    return <TokenListSkeleton count={5} />;
  }

  if (virtualItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <UIText kind="body/regular" color="var(--neutral-500)">
          No tokens found
        </UIText>
      </div>
    );
  }

  return (
    <VirtualizedTokenList
      items={virtualItems}
      renderItem={(row) =>
        renderFungibleRow(row, currency, positionLookup, onSelect)
      }
      renderHeader={(label) => (
        <div className={styles.sectionHeader}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            {label}
          </UIText>
        </div>
      )}
    />
  );
}

function buildOtherRows(
  fungible: Fungible,
  activeChain: string,
  chipOrder: string[],
  networks: Networks
): RowItem[] {
  const implChains = Object.keys(fungible.implementations).filter(
    (c) => c !== activeChain
  );
  if (implChains.length === 0) return [];
  const implSet = new Set(implChains);
  const ordered: string[] = [];
  for (const chipChainId of chipOrder) {
    if (chipChainId === activeChain) continue;
    if (implSet.has(chipChainId)) {
      ordered.push(chipChainId);
      implSet.delete(chipChainId);
    }
  }
  for (const chainId of implChains) {
    if (implSet.has(chainId)) ordered.push(chainId);
  }
  return ordered.map((chainId) => ({
    fungible,
    chainId,
    ...resolveChain(networks, chainId),
  }));
}

function SearchResults({
  query,
  activeChain,
  chipOrder,
  currency,
  networks,
  positionLookup,
  onSelect,
}: {
  query: string;
  activeChain: string;
  chipOrder: string[];
  currency: string;
  networks: Networks;
  positionLookup: Map<string, FungiblePosition>;
  onSelect: (fungible: Fungible, chainId: string) => void;
}) {
  const { fungibles } = useSearchQueryFungibles({
    query,
    currency,
    limit: 50,
  });

  const virtualItems = useMemo<VirtualListItem<RowItem>[]>(() => {
    if (!fungibles) {
      return [];
    }
    const sameRows: VirtualListItem<RowItem>[] = [];
    const otherRows: VirtualListItem<RowItem>[] = [];
    for (const fungible of fungibles) {
      const hasActive = Boolean(fungible.implementations[activeChain]);
      if (hasActive) {
        sameRows.push({
          kind: 'item',
          key: `same-${fungible.id}-${activeChain}`,
          data: {
            fungible,
            chainId: activeChain,
            ...resolveChain(networks, activeChain),
          },
        });
      }
      const others = buildOtherRows(fungible, activeChain, chipOrder, networks);
      for (const row of others) {
        otherRows.push({
          kind: 'item',
          key: `other-${fungible.id}-${row.chainId}`,
          data: row,
        });
      }
    }
    const result: VirtualListItem<RowItem>[] = [];
    if (sameRows.length > 0) {
      result.push({ kind: 'header', key: 'same', label: 'Same network' });
      result.push(...sameRows);
    }
    if (otherRows.length > 0) {
      result.push({ kind: 'header', key: 'other', label: 'Other networks' });
      result.push(...otherRows);
    }
    return result;
  }, [fungibles, activeChain, chipOrder, networks]);

  if (!fungibles || virtualItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <UIText kind="body/regular" color="var(--neutral-500)">
          No tokens found
        </UIText>
      </div>
    );
  }

  return (
    <VirtualizedTokenList
      items={virtualItems}
      renderItem={(row) =>
        renderFungibleRow(row, currency, positionLookup, onSelect)
      }
      renderHeader={(label) => (
        <div className={styles.sectionHeader}>
          <UIText kind="small/accent" color="var(--neutral-500)">
            {label}
          </UIText>
        </div>
      )}
    />
  );
}

function resolveDefaultChain(
  outputChainId: string | null,
  inputChainId: string | null
): string {
  return outputChainId || inputChainId || SOLANA_CHAIN_ID;
}

export function OutputPositionSelector({
  positions,
  receiverPositions,
  networks,
  outputChainId,
  inputChainId,
  onSelect,
  open,
  onClose,
}: {
  positions: FungiblePosition[];
  receiverPositions: FungiblePosition[];
  networks: Networks;
  outputChainId: string | null;
  inputChainId: string | null;
  onSelect: (fungible: Fungible, chainId: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { currency } = useCurrency();
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>(() =>
    resolveDefaultChain(outputChainId, inputChainId)
  );
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

  // On dialog open: re-derive the default tab, reset the search query, scroll
  // active chip into view. Tab selection is reset automatically because Dialog2
  // unmounts its children on close, which destroys the TabProvider; reopening
  // remounts it with `selectedId` derived from the current `selectedNetwork`.
  useEffect(() => {
    if (!open) {
      setPinnedFromDialog(null);
      return;
    }
    const next = resolveDefaultChain(outputChainId, inputChainId);
    setSelectedNetwork(next);
    setDebouncedQuery('');
    requestAnimationFrame(() => {
      scrollChipIntoView(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isTradableChainId = useMemo(() => {
    const cache = new Map<string, boolean>();
    return (chainId: string) => {
      const cached = cache.get(chainId);
      if (cached !== undefined) return cached;
      const network = networks.getByNetworkId(createChain(chainId));
      const ok = Boolean(
        network?.supports_trading || network?.supports_bridging
      );
      cache.set(chainId, ok);
      return ok;
    };
  }, [networks]);

  const tradablePositions = useMemo(
    () => positions.filter((p) => isTradableChainId(p.chain.id)),
    [positions, isTradableChainId]
  );

  const tradablePadChainIds = useMemo(
    () => RECEIVE_PAD_CHAIN_IDS.filter((id) => isTradableChainId(id)),
    [isTradableChainId]
  );

  const topNetworks: TopNetworksEntry[] = useTopNetworks(
    tradablePositions,
    selectedNetwork,
    pinnedFromDialog,
    {
      pinnedFirstChainId: SOLANA_CHAIN_ID,
      fallbackChainId: ETHEREUM_CHAIN_ID,
      networks,
      padChainIds: tradablePadChainIds,
    }
  );

  const chipOrder = useMemo(
    () => topNetworks.map((n) => n.chainId),
    [topNetworks]
  );

  const chainDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    const chains: Record<string, true> = {};
    let totalValue = 0;
    for (const p of positions) {
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
  }, [positions]);

  const positionLookup = useMemo(() => {
    const map = new Map<string, FungiblePosition>();
    for (const p of receiverPositions) {
      map.set(positionKey(p.chain.id, p.fungible.id), p);
    }
    return map;
  }, [receiverPositions]);

  const debouncedSetQuery = useDebouncedCallback(
    (value: string) => setDebouncedQuery(value),
    300
  );

  return (
    <>
      <Dialog2 open={open} onClose={onClose} title="Receive">
        {open && !networkSelector.open ? (
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
              debouncedSetQuery(value);
            }}
          >
            <TabProvider
              selectedId={selectedNetwork}
              setSelectedId={(id) => {
                if (!id) return;
                setSelectedNetwork(id);
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
                    showAllTab={false}
                    onOpenNetworkSelector={networkSelector.openDialog}
                  />
                </div>
                <div className={styles.scrollArea}>
                  <TabPanelWrapper>
                    {debouncedQuery ? (
                      <SearchResults
                        query={debouncedQuery}
                        activeChain={selectedNetwork}
                        chipOrder={chipOrder}
                        currency={currency}
                        networks={networks}
                        positionLookup={positionLookup}
                        onSelect={(fungible, chainId) => {
                          onSelect(fungible, chainId);
                          onClose();
                        }}
                      />
                    ) : (
                      <ReceiveFungiblesList
                        chain={selectedNetwork}
                        currency={currency}
                        networks={networks}
                        positionLookup={positionLookup}
                        onSelect={(fungible, chainId) => {
                          onSelect(fungible, chainId);
                          onClose();
                        }}
                      />
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
        value={selectedNetwork}
        chainDistribution={chainDistribution}
        standard="all"
        filterPredicate={(network) =>
          network.supports_trading || network.supports_bridging
        }
        onSelect={(value) => {
          setSelectedNetwork(value);
          setPinnedFromDialog(value);
          requestAnimationFrame(() => {
            scrollChipIntoView(value);
          });
          setTimeout(() => {
            comboboxRef.current?.focus();
          }, 300);
        }}
      />
    </>
  );
}
