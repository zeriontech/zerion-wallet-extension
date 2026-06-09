import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { UIText } from 'src/ui/ui-kit/UIText';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Input } from 'src/ui/ui-kit/Input';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import {
  ALL_NETWORKS_TAB_ID,
  NetworkChips,
  TabPanelWrapper,
} from 'src/ui/components/PositionSelector/NetworkChips';
import { TokenRow } from 'src/ui/components/PositionSelector/TokenRow';
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
  onSelect: (position: FungiblePosition, selectedTab: string | null) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { currency } = useCurrency();
  const [searchValue, setSearchValue] = useState('');

  const tradablePositions = useMemo(() => {
    const resolvedNetworks = networks;
    if (!resolvedNetworks) return positions;
    const cache = new Map<string, boolean>();
    const isTradable = (chainId: string) => {
      const cached = cache.get(chainId);
      if (cached !== undefined) return cached;
      const network = resolvedNetworks.getByNetworkId(createChain(chainId));
      const ok = Boolean(
        network?.supports_trading || network?.supports_bridging
      );
      cache.set(chainId, ok);
      return ok;
    };
    return positions.filter((p) => isTradable(p.chain.id));
  }, [positions, networks]);

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

  useEffect(() => {
    if (!open) {
      setPinnedFromDialog(null);
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
          normalizedContains(p.fungible.symbol.toLowerCase(), query)
      );
    }
    return result.sort((a, b) => (b.amount.value || 0) - (a.amount.value || 0));
  }, [tradablePositions, selectedNetwork, searchValue]);

  const virtualItems = useMemo<VirtualListItem<FungiblePosition>[]>(
    () =>
      filteredPositions.map((position) => ({
        kind: 'item',
        key: `${position.chain.id}-${position.fungible.id}`,
        data: position,
      })),
    [filteredPositions]
  );

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
            setValue={setSearchValue}
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
                      <div className={styles.emptyState}>
                        <UIText kind="body/regular" color="var(--neutral-500)">
                          No tokens found
                        </UIText>
                      </div>
                    ) : (
                      <VirtualizedTokenList
                        items={virtualItems}
                        renderItem={(position) => (
                          <TokenRow
                            fungible={position.fungible}
                            chainId={position.chain.id}
                            chainIconUrl={position.chain.iconUrl}
                            chainName={position.chain.name}
                            fiatValue={position.amount.value}
                            tokenQuantity={position.amount.quantity}
                            currency={currency}
                            onSelect={() => {
                              onSelect(position, selectedNetwork);
                              onClose();
                            }}
                          />
                        )}
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
