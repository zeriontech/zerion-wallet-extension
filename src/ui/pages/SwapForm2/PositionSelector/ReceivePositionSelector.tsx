import React, {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ComboboxProvider, Combobox, TabProvider } from '@ariakit/react';
import type { Networks } from 'src/modules/networks/Networks';
import { createChain } from 'src/modules/networks/Chain';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useReceiveFungibles } from 'src/modules/zerion-api/hooks/useReceiveFungibles';
import { useSearchQueryFungibles } from 'src/modules/zerion-api/hooks/useSearchQueryFungibles';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import {
  ALL_NETWORKS_TAB_ID,
  NetworkChips,
  TabPanelWrapper,
} from './NetworkChips';
import { TokenRow } from './TokenRow';
import { useTopNetworks } from './useTopNetworks';
import { NetworkSelectorDialog } from './NetworkSelectorDialog';
import type { VirtualListItem } from './VirtualizedTokenList';
import { VirtualizedTokenList } from './VirtualizedTokenList';
import * as styles from './styles.module.css';

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

function TokenListSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
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
      ))}
    </>
  );
}

function renderFungibleRow(
  { fungible, chainId, chainIconUrl, chainName }: RowItem,
  currency: string,
  onSelect: (fungible: Fungible, chainId: string) => void
) {
  return (
    <TokenRow
      fungible={fungible}
      chainIconUrl={chainIconUrl}
      chainName={chainName}
      fiatValue={null}
      tokenQuantity={null}
      currency={currency}
      onSelect={() => onSelect(fungible, chainId)}
    />
  );
}

function ReceiveFungiblesList({
  chain,
  currency,
  networks,
  onSelect,
}: {
  chain: string | null;
  currency: string;
  networks: Networks;
  onSelect: (fungible: Fungible, chainId: string) => void;
}) {
  const { data } = useReceiveFungibles({
    chain: chain || undefined,
    currency,
  });

  const selectChain = (fungible: Fungible) => {
    if (chain && fungible.implementations[chain]) {
      return chain;
    }
    const chains = Object.keys(fungible.implementations);
    return chains[0] || chain || '';
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
      renderItem={(row) => renderFungibleRow(row, currency, onSelect)}
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

function SearchResults({
  query,
  chain,
  currency,
  networks,
  onSelect,
}: {
  query: string;
  chain: string | null;
  currency: string;
  networks: Networks;
  onSelect: (fungible: Fungible, chainId: string) => void;
}) {
  const { fungibles } = useSearchQueryFungibles({
    query,
    currency,
    chain: chain || undefined,
    limit: 50,
  });

  const virtualItems = useMemo<VirtualListItem<RowItem>[]>(() => {
    if (!fungibles) {
      return [];
    }
    return fungibles.map((fungible) => {
      const chainId =
        chain && fungible.implementations[chain]
          ? chain
          : Object.keys(fungible.implementations)[0] || '';
      return {
        kind: 'item',
        key: fungible.id,
        data: { fungible, chainId, ...resolveChain(networks, chainId) },
      };
    });
  }, [fungibles, chain, networks]);

  if (!fungibles || fungibles.length === 0) {
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
      renderItem={(row) => renderFungibleRow(row, currency, onSelect)}
    />
  );
}

export function ReceivePositionSelector({
  positions,
  networks,
  currentChain,
  onSelect,
  open,
  onClose,
}: {
  positions: FungiblePosition[];
  networks: Networks;
  currentChain: string | undefined;
  onSelect: (fungible: Fungible, chainId: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { currency } = useCurrency();
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const networkSelector = useDialog2();
  const comboboxRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedNetwork(null);
      setDebouncedQuery('');
    }
  }, [open, currentChain]);

  const scrollChipIntoView = (chainId: string) => {
    const el = chipsRef.current?.querySelector<HTMLElement>(
      `[data-chain-id="${chainId}"]`
    );
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  };

  const topNetworks = useTopNetworks(positions, selectedNetwork);

  const debouncedSetQuery = useDebouncedCallback(
    (value: string) => setDebouncedQuery(value),
    300
  );

  return (
    <Dialog2 open={open} onClose={onClose} title="Receive">
      <div style={{ height: 2 }} />
      <ComboboxProvider
        resetValueOnHide
        setValue={(value) => {
          debouncedSetQuery(value);
        }}
      >
        <TabProvider
          selectedId={selectedNetwork ?? ALL_NETWORKS_TAB_ID}
          setSelectedId={(id) => {
            startTransition(() => {
              setSelectedNetwork(
                id === ALL_NETWORKS_TAB_ID ? null : (id as string | null)
              );
            });
          }}
        >
          <div className={styles.searchWrapper}>
            <Combobox
              ref={comboboxRef}
              render={<SearchInput placeholder="Search tokens" />}
            />
          </div>
          <NetworkChips
            ref={chipsRef}
            networks={topNetworks}
            onOpenNetworkSelector={networkSelector.openDialog}
          />
          <TabPanelWrapper>
            {debouncedQuery ? (
              <SearchResults
                query={debouncedQuery}
                chain={selectedNetwork}
                currency={currency}
                networks={networks}
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
                onSelect={(fungible, chainId) => {
                  onSelect(fungible, chainId);
                  onClose();
                }}
              />
            )}
          </TabPanelWrapper>
        </TabProvider>
      </ComboboxProvider>
      <NetworkSelectorDialog
        open={networkSelector.open}
        onClose={networkSelector.closeDialog}
        networks={networks}
        positions={positions}
        mode="receive"
        onSelect={(chainId) => {
          setSelectedNetwork(chainId);
          networkSelector.closeDialog();
          requestAnimationFrame(() => {
            comboboxRef.current?.focus();
            scrollChipIntoView(chainId);
          });
        }}
      />
    </Dialog2>
  );
}
