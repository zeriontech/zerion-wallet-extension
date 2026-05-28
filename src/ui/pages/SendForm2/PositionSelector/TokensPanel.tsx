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
import { Input } from 'src/ui/ui-kit/Input';
import { Button } from 'src/ui/ui-kit/Button';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { useAddressPositionsFromNode2 } from 'src/ui/shared/requests/useAddressPositionsFromNode2';
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
import { getAddressType } from 'src/shared/wallet/classifiers';

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

function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonInfo}>
        <div className={styles.skeletonLineLg} />
        <div className={styles.skeletonLineSm} />
      </div>
      <div className={styles.skeletonValues}>
        <div className={styles.skeletonValueLg} />
        <div className={styles.skeletonValueSm} />
      </div>
    </div>
  );
}

function NodePositionsForChain({
  address,
  chainId,
  currency,
  networks,
  onSelect,
}: {
  address: string;
  chainId: string;
  currency: string;
  networks: Networks;
  onSelect: (position: FungiblePosition) => void;
}) {
  const chain = createChain(chainId);
  const { data, isLoading, isError, refetch } = useAddressPositionsFromNode2({
    address,
    chain,
    currency,
  });

  if (isLoading) {
    return <SkeletonRow />;
  }
  if (isError) {
    return (
      <div className={styles.emptyState}>
        <UIText kind="body/regular" color="var(--neutral-500)">
          Couldn&apos;t load balances
        </UIText>
        <Button kind="regular" size={36} onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <UIText kind="body/regular" color="var(--neutral-500)">
          No tokens found
        </UIText>
      </div>
    );
  }

  const items: VirtualListItem<FungiblePosition>[] = data.map((position) => ({
    kind: 'item',
    key: `${position.chain.id}-${position.fungible.id}`,
    data: position,
  }));

  return (
    <VirtualizedTokenList
      items={items}
      renderItem={(position) => (
        <TokenRow
          fungible={position.fungible}
          chainId={position.chain.id}
          chainIconUrl={position.chain.iconUrl || networks.getChainName(chain)}
          chainName={position.chain.name}
          fiatValue={position.amount.value}
          tokenQuantity={position.amount.quantity}
          currency={currency}
          onSelect={() => onSelect(position)}
        />
      )}
    />
  );
}

interface TokensPanelProps {
  address: string;
  positions: FungiblePosition[];
  networks: Networks;
  defaultSelectedNetwork: string | null;
  onSelectedNetworkChange: (chainId: string | null) => void;
  onSelect: (position: FungiblePosition) => void;
  /** Whether the parent dialog is currently open; used to scope keyboard shortcuts. */
  open: boolean;
}

export function TokensPanel({
  address,
  positions,
  networks,
  defaultSelectedNetwork,
  onSelectedNetworkChange,
  onSelect,
  open,
}: TokensPanelProps) {
  const { currency } = useCurrency();
  const [searchValue, setSearchValue] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(
    defaultSelectedNetwork
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

  // Per-panel focus on mount — bypass Dialog2's focus trap.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      comboboxRef.current?.focus();
      scrollChipIntoView(selectedNetwork ?? ALL_NETWORKS_TAB_ID);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent of network changes so the choice persists across dialog opens.
  useEffect(() => {
    onSelectedNetworkChange(selectedNetwork);
  }, [selectedNetwork, onSelectedNetworkChange]);

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

  const topNetworks = useTopNetworks(
    positions,
    selectedNetwork,
    pinnedFromDialog,
    { networks }
  );

  const selectedNetworkConfig = useMemo(() => {
    if (!selectedNetwork) return null;
    return networks.getByNetworkId(createChain(selectedNetwork)) ?? null;
  }, [networks, selectedNetwork]);

  const useNodePositions = Boolean(
    selectedNetwork &&
      selectedNetworkConfig &&
      !selectedNetworkConfig.supports_positions
  );

  // All-chains view: simple positions only (no node-positions fan-out).
  // Specific chain on a supports_positions chain: filter simple positions.
  // Specific chain on a non-supports_positions chain: render <NodePositionsForChain/>.
  const filteredPositions = useMemo(() => {
    if (useNodePositions) return [];
    let result = positions;
    if (selectedNetwork) {
      result = result.filter((p) => p.chain.id === selectedNetwork);
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
  }, [positions, selectedNetwork, searchValue, useNodePositions]);

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
      {open && !networkSelector.open ? (
        <KeyboardShortcut
          combination="shift+right"
          availableDuringInputs={true}
          onKeyDown={networkSelector.openDialog}
        />
      ) : null}
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
                showNetworkSelectorTrigger={true}
              />
            </div>
            <div className={styles.scrollArea}>
              <TabPanelWrapper>
                {useNodePositions && selectedNetwork ? (
                  <NodePositionsForChain
                    address={address}
                    chainId={selectedNetwork}
                    currency={currency}
                    networks={networks}
                    onSelect={onSelect}
                  />
                ) : virtualItems.length === 0 ? (
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
                        onSelect={() => onSelect(position)}
                      />
                    )}
                  />
                )}
              </TabPanelWrapper>
            </div>
          </div>
        </TabProvider>
      </ComboboxProvider>
      <NetworkSelect2
        open={networkSelector.open}
        onClose={networkSelector.closeDialog}
        value={selectedNetwork ?? NetworkSelectValue.All}
        chainDistribution={chainDistribution}
        standard={getAddressType(address)}
        showEcosystemHint={true}
        showAllNetworksOption={true}
        // filterPredicate={(network) => network.supports_sending}
        onSelect={(value) => {
          const isAll = value === NetworkSelectValue.All;
          const nextChainId = isAll ? null : value;
          setSelectedNetwork(nextChainId);
          setPinnedFromDialog(nextChainId);
          requestAnimationFrame(() => {
            scrollChipIntoView(nextChainId ?? ALL_NETWORKS_TAB_ID);
          });
          setTimeout(() => {
            comboboxRef.current?.focus();
          }, 300);
        }}
      />
    </>
  );
}
