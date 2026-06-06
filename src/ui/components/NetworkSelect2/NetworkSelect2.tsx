import React, {
  startTransition,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Combobox,
  ComboboxList,
  ComboboxProvider,
  DialogDismiss,
} from '@ariakit/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import CloseIcon from 'jsx:src/ui/assets/close.svg';
import EcosystemEthereumIcon from 'jsx:src/ui/assets/ecosystem-ethereum.svg';
import EcosystemSolanaIcon from 'jsx:src/ui/assets/ecosystem-solana.svg';
import SearchIcon from 'jsx:src/ui/assets/search.svg';
import { filterAndSortNetworksByQuery } from 'src/modules/ethereum/chains/filterNetworkByQuery';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks } from 'src/modules/networks/Networks';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import {
  useNetworks,
  useSearchNetworks,
} from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import {
  mainNetworksStore,
  testenvNetworksStore,
} from 'src/modules/networks/networks-store.client';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { walletPort } from 'src/ui/shared/channels';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { usePreferences } from 'src/ui/features/preferences';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { Dialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { Input } from 'src/ui/ui-kit/Input';
import { UIText } from 'src/ui/ui-kit/UIText';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { VStack } from 'src/ui/ui-kit/VStack';
import noResultsImg from 'url:src/ui/assets/no-results@2x.png';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import type { NetworkSelectDistribution } from './types';
import { createGroups2 } from './createNetworkGroups2';
import { NetworkRow } from './NetworkRow';
import * as styles from './styles.module.css';

const ROW_HEIGHT = 48;
const SECTION_HEADER_HEIGHT = 28;
const ALL_ROW_KEY = `__all__:${NetworkSelectValue.All}`;

async function updateNetworks() {
  return Promise.all([
    mainNetworksStore.update(),
    testenvNetworksStore.update(),
  ]);
}

type ListItem =
  | { kind: 'all'; key: string; selected: boolean }
  | { kind: 'header'; key: string; label: string }
  | {
      kind: 'network';
      key: string;
      network: NetworkConfig;
      name: string;
      selected: boolean;
    };

function ShowTestnetsHint() {
  return (
    <UIText
      kind="caption/regular"
      color="var(--neutral-500)"
      style={{
        textAlign: 'center',
        width: '100%',
        padding: 10,
        backgroundColor: 'var(--neutral-100)',
        borderRadius: 12,
      }}
    >
      Looking for testnets?
      <br />
      Enable Testnet Mode in{' '}
      <TextLink
        to="/settings/developer-tools"
        style={{ color: 'var(--primary)' }}
      >
        Settings → Developer Tools
      </TextLink>
    </UIText>
  );
}

function EmptyView({ testnetMode }: { testnetMode: boolean }) {
  return (
    <div className={styles.emptyState}>
      <VStack gap={16} style={{ justifyItems: 'center' }}>
        <img
          src={noResultsImg}
          style={{ width: 80, height: 64 }}
          alt="no results"
        />
        <VStack gap={8} style={{ justifyItems: 'center' }}>
          <UIText kind="headline/h3">No results found</UIText>
          <UIText kind="small/regular" color="var(--neutral-500)">
            Please try filtering with different criteria
          </UIText>
        </VStack>
      </VStack>
      <Button
        as={UnstyledLink}
        to="/networks/create"
        style={{ paddingInline: 16 }}
      >
        Add Network
      </Button>
      {testnetMode ? null : <ShowTestnetsHint />}
    </div>
  );
}

function EcosystemHint({ standard }: { standard: BlockchainType }) {
  return (
    <UnstyledLink to="/wallet-select" className={styles.ecosystemHint}>
      <HStack
        gap={12}
        alignItems="center"
        style={{
          padding: '8px 36px 8px 12px',
          borderRadius: 16,
          backgroundColor: 'var(--neutral-100)',
        }}
      >
        {standard === 'evm' ? (
          <EcosystemSolanaIcon style={{ width: 36, height: 36 }} />
        ) : (
          <EcosystemEthereumIcon style={{ width: 36, height: 36 }} />
        )}
        <UIText kind="small/regular">
          {standard === 'evm'
            ? 'To use the Solana ecosystem, choose Solana wallet.'
            : 'To use the Ethereum ecosystem, choose Ethereum wallet.'}
        </UIText>
      </HStack>
    </UnstyledLink>
  );
}

function VirtualizedList({
  items,
  chainDistribution,
  address,
  ecosystem,
  onSelect,
}: {
  items: ListItem[];
  chainDistribution: NetworkSelectDistribution | null;
  address?: string;
  ecosystem?: BlockchainType;
  onSelect: (value: string) => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let node: HTMLElement | null = listRef.current?.parentElement ?? null;
    while (node) {
      const { overflowY } = window.getComputedStyle(node);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        setScrollElement(node);
        return;
      }
      node = node.parentElement;
    }
    setScrollElement(null);
  }, []);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) =>
      items[index].kind === 'header' ? SECTION_HEADER_HEIGHT : ROW_HEIGHT,
    overscan: 8,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    getItemKey: (index) => items[index].key,
  });

  return (
    <ComboboxList
      alwaysVisible
      ref={listRef}
      className={styles.list}
      style={{
        height: virtualizer.getTotalSize(),
        position: 'relative',
        width: '100%',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = items[virtualRow.index];
        const offset = virtualRow.start - virtualizer.options.scrollMargin;
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${offset}px)`,
            }}
          >
            {item.kind === 'header' ? (
              <UIText
                kind="small/accent"
                color="var(--neutral-500)"
                className={styles.sectionHeader}
              >
                {item.label}
              </UIText>
            ) : item.kind === 'all' ? (
              <NetworkRow
                value={NetworkSelectValue.All}
                name="All Networks"
                iconUrl={null}
                selected={item.selected}
                onSelect={onSelect}
                chainDistribution={chainDistribution}
                address={address}
              />
            ) : (
              <NetworkRow
                value={item.network.id}
                name={item.name}
                iconUrl={item.network.icon_url}
                selected={item.selected}
                onSelect={onSelect}
                chainDistribution={chainDistribution}
                address={address}
                ecosystem={ecosystem ?? Networks.getEcosystem(item.network)}
              />
            )}
          </div>
        );
      })}
    </ComboboxList>
  );
}

function FooterAddNetworkLink() {
  return (
    <div className={styles.footer}>
      <UnstyledLink to="/networks/create" style={{ display: 'block' }}>
        <Button kind="ghost" as="div" size={40} style={{ width: '100%' }}>
          <HStack gap={8} alignItems="center" justifyContent="center">
            <AddCircleIcon style={{ display: 'block' }} />
            <UIText kind="body/accent">Add Network</UIText>
          </HStack>
        </Button>
      </UnstyledLink>
    </div>
  );
}

function NetworkSelect2Content({
  value,
  standard,
  chainDistribution,
  filterPredicate,
  showAllNetworksOption,
  showEcosystemHint,
  onSelect,
}: {
  value: string;
  standard: BlockchainType | 'all';
  chainDistribution: NetworkSelectDistribution | null;
  filterPredicate: (network: NetworkConfig) => boolean;
  showAllNetworksOption: boolean;
  showEcosystemHint: boolean;
  onSelect: (value: string) => void;
}) {
  const { preferences } = usePreferences();
  const testnetMode = Boolean(preferences?.testnetMode?.on);

  const distributionChains = useMemo(
    () => Object.keys(chainDistribution?.chains || {}),
    [chainDistribution]
  );
  const { networks } = useNetworks(distributionChains);

  const [searchValue, setSearchValue] = useState('');
  const [query, setQuery] = useState('');
  const debouncedSetQuery = useDebouncedCallback(
    useCallback((value: string) => setQuery(value), []),
    200
  );

  const { networks: searchNetworks } = useSearchNetworks({ query });

  const groups = useMemo(() => {
    if (!networks) return [];
    return createGroups2({
      standard,
      networks,
      chainDistribution,
      testnetMode,
      filterPredicate,
    });
  }, [networks, standard, chainDistribution, testnetMode, filterPredicate]);

  const searchItems = useMemo<NetworkConfig[]>(() => {
    if (!query || !searchNetworks) return [];
    const pool = testnetMode
      ? searchNetworks.getNetworks()
      : searchNetworks.getMainnets();
    return filterAndSortNetworksByQuery(
      pool.filter((n) => !n.hidden).filter(filterPredicate),
      query
    );
  }, [filterPredicate, query, searchNetworks, testnetMode]);

  const items = useMemo<ListItem[]>(() => {
    if (!networks) return [];
    if (query) {
      return searchItems.map((network) => ({
        kind: 'network',
        key: network.id,
        network,
        name: networks.getChainName(createChain(network.id)),
        selected: network.id === value,
      }));
    }
    const list: ListItem[] = [];
    if (showAllNetworksOption) {
      list.push({
        kind: 'all',
        key: ALL_ROW_KEY,
        selected: value === NetworkSelectValue.All,
      });
    }
    groups.forEach((group) => {
      if (group.items.length === 0) return;
      if (group.name) {
        list.push({
          kind: 'header',
          key: `header:${group.key}`,
          label: group.name,
        });
      }
      group.items.forEach((network) => {
        list.push({
          kind: 'network',
          key: network.id,
          network,
          name: networks.getChainName(createChain(network.id)),
          selected: network.id === value,
        });
      });
    });
    return list;
  }, [networks, groups, query, searchItems, showAllNetworksOption, value]);

  const networkCount = useMemo(
    () => groups.reduce((acc, g) => acc + g.items.length, 0),
    [groups]
  );

  const { singleAddress } = useAddressParams();
  const ecosystem: BlockchainType | undefined =
    standard === 'evm' ? 'evm' : standard === 'solana' ? 'solana' : undefined;

  if (!networks) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <UIText kind="headline/h3" className={styles.title}>
          Networks
        </UIText>
        <UnstyledLink to="/networks" title="Network Settings">
          <Button kind="ghost" as="div" size={32} style={{ paddingInline: 12 }}>
            <UIText kind="small/accent">Edit</UIText>
          </Button>
        </UnstyledLink>
        <UnstyledLink to="/networks/create" title="Add Network">
          <Button kind="ghost" as="div" size={32} style={{ width: 32 }}>
            <AddCircleIcon
              style={{ width: 20, height: 20, display: 'block' }}
            />
          </Button>
        </UnstyledLink>
        <DialogDismiss
          render={
            <Button
              kind="ghost"
              as="button"
              size={32}
              style={{ width: 32, paddingInline: 6 }}
            >
              <CloseIcon style={{ width: 20, height: 20, display: 'block' }} />
            </Button>
          }
        />
      </div>
      <ComboboxProvider
        resetValueOnHide
        setValue={(next) => {
          setSearchValue(next);
          startTransition(() => debouncedSetQuery(next));
        }}
      >
        {networkCount > 2 ? (
          <div className={styles.searchWrapper}>
            <div style={{ position: 'relative' }}>
              <SearchIcon
                role="presentation"
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: 12,
                  top: 8,
                  width: 24,
                  height: 24,
                  color: 'var(--neutral-500)',
                }}
              />
              <Combobox
                autoSelect
                render={
                  <Input
                    boxHeight={40}
                    type="search"
                    placeholder="Search"
                    style={{ paddingLeft: 40 }}
                  />
                }
                value={searchValue}
              />
            </div>
          </div>
        ) : null}
        {standard !== 'all' && showEcosystemHint ? (
          <EcosystemHint standard={standard} />
        ) : null}
        <div className={styles.scrollArea}>
          {items.length === 0 ? (
            <EmptyView testnetMode={testnetMode} />
          ) : (
            <VirtualizedList
              items={items}
              chainDistribution={chainDistribution}
              address={singleAddress}
              ecosystem={ecosystem}
              onSelect={onSelect}
            />
          )}
          <Spacer height={8} />
        </div>
      </ComboboxProvider>
      <FooterAddNetworkLink />
    </div>
  );
}

export function NetworkSelect2({
  open,
  onClose,
  onSelect,
  value,
  standard = 'evm',
  chainDistribution,
  filterPredicate = () => true,
  showAllNetworksOption = false,
  showEcosystemHint = false,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  value: string;
  standard?: BlockchainType | 'all';
  chainDistribution: NetworkSelectDistribution | null;
  filterPredicate?: (network: NetworkConfig) => boolean;
  showAllNetworksOption?: boolean;
  showEcosystemHint?: boolean;
}) {
  const handleSelect = (nextValue: string) => {
    if (nextValue !== NetworkSelectValue.All) {
      walletPort
        .request('addVisitedEthereumChain', { chain: nextValue })
        .then(() => updateNetworks());
    }
    onSelect(nextValue);
    onClose();
  };

  return (
    <Dialog2 open={open} onClose={onClose}>
      <NetworkSelect2Content
        value={value}
        standard={standard}
        chainDistribution={chainDistribution}
        filterPredicate={filterPredicate}
        showAllNetworksOption={showAllNetworksOption}
        showEcosystemHint={showEcosystemHint}
        onSelect={handleSelect}
      />
    </Dialog2>
  );
}
