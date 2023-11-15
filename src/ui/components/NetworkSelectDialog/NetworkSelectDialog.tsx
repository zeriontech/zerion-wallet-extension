import React, { useCallback, useMemo, useRef, useState } from 'react';
import { isTruthy } from 'is-truthy-ts';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Media } from 'src/ui/ui-kit/Media';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import {
  SurfaceItemButton,
  SurfaceItemLink,
  SurfaceList,
} from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { filterNetworksByQuery } from 'src/modules/ethereum/chains/filterNetworkByQuery';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import type { ChainDistribution } from 'src/ui/shared/requests/PortfolioValue/ChainValue';
import { ChainValue } from 'src/ui/shared/requests/PortfolioValue/ChainValue';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { DelayedRender } from '../DelayedRender';
import { NetworkIcon } from '../NetworkIcon';
import { PageBottom } from '../PageBottom';
import { PageColumn } from '../PageColumn';
import { ViewLoading } from '../ViewLoading';
import { EmptyView } from '../EmptyView';
import { KeyboardShortcut } from '../KeyboardShortcut';

const LIST_ITEM_CLASS = 'network-list-item';

function NetworkList({
  title,
  networks,
  networkList,
  value,
  chainDistribution,
  previousListLength = 0,
}: {
  title?: string;
  value?: string;
  networks: Networks;
  networkList: NetworkConfig[];
  chainDistribution: ChainDistribution | null;
  previousListLength?: number;
}) {
  if (!networkList.length) {
    return (
      <EmptyView
        text={
          <VStack gap={8}>
            <div>No Networks</div>
            <div>
              <TextLink
                style={{ color: 'var(--primary)' }}
                to="/networks/create/search"
              >
                Add First
              </TextLink>
            </div>
          </VStack>
        }
      />
    );
  }
  return (
    <SurfaceList
      style={{ paddingBlock: 0 }}
      items={[
        title
          ? {
              key: title,
              pad: false,
              style: { padding: 0 },
              component: (
                <UIText
                  kind="small/accent"
                  color="var(--neutral-500)"
                  style={{ paddingBlock: 8 }}
                >
                  {title}
                </UIText>
              ),
            }
          : null,
        ...networkList.map((network, index) => {
          const isSupportedByBackend = networks.isSupportedByBackend(
            createChain(network.chain)
          );
          return {
            key: network.external_id || network.chain,
            isInteractive: true,
            pad: false,
            component: (
              <SurfaceItemButton
                data-class={LIST_ITEM_CLASS}
                data-index={previousListLength + index}
                value={network.chain}
                outlined={network.chain === value}
                style={{ padding: 0 }}
              >
                <HStack
                  gap={4}
                  justifyContent="space-between"
                  alignItems="center"
                  style={{ paddingBlock: 4 }}
                >
                  <Media
                    image={
                      <NetworkIcon
                        size={24}
                        src={network.icon_url}
                        chainId={network.external_id}
                        name={network.name}
                      />
                    }
                    text={
                      <UIText kind="body/accent">
                        {networks.getChainName(createChain(network.chain))}
                      </UIText>
                    }
                    vGap={0}
                    detailText={null}
                  />
                  <UIText
                    kind="small/regular"
                    color={
                      network.chain === value
                        ? 'var(--primary)'
                        : 'var(--neutral-500)'
                    }
                  >
                    {isSupportedByBackend ? (
                      <ChainValue
                        chain={createChain(network.chain)}
                        chainDistribution={chainDistribution}
                      />
                    ) : null}
                  </UIText>
                </HStack>
              </SurfaceItemButton>
            ),
          };
        }),
      ].filter(isTruthy)}
    />
  );
}

function compareChains(
  a: NetworkConfig,
  b: NetworkConfig,
  chainDistribution: ChainDistribution | null
) {
  const aString = a.chain.toString();
  const bString = b.chain.toString();
  const aValue = chainDistribution?.positions_chains_distribution[aString];
  const bValue = chainDistribution?.positions_chains_distribution[bString];

  if (aValue && bValue) return bValue - aValue;
  if (aValue && !bValue) return -1;
  if (!aValue && bValue) return 1;
  return aString < bString ? -1 : aString > bString ? 1 : 0;
}

enum Tab {
  mainnets,
  testnets,
  customList,
}

function SectionView({
  networks,
  value,
  chainDistribution,
}: {
  tab: Tab;
  value: string;
  networks: Networks;
  onTabChange: (event: React.FormEvent<HTMLInputElement>) => void;
  chainDistribution: ChainDistribution | null;
}) {
  const mainnetList = useMemo(
    () =>
      networks
        .getMainnets()
        .filter((network) => !network.hidden)
        .sort((a, b) => compareChains(a, b, chainDistribution)),
    [networks, chainDistribution]
  );
  const customList = useMemo(
    () => networks.getCustomNetworks().filter((network) => !network.hidden),
    [networks]
  );
  const testnetList = useMemo(
    () => networks.getTestNetworks().filter((network) => !network.hidden),
    [networks]
  );

  return (
    <form
      method="dialog"
      style={{
        display: 'grid',
        flexGrow: 1,
      }}
    >
      <VStack gap={8}>
        <NetworkList
          title="Mainnets"
          value={value}
          networks={networks}
          networkList={mainnetList}
          chainDistribution={chainDistribution}
        />

        {customList.length ? (
          <NetworkList
            title="Manually Added"
            value={value}
            networks={networks}
            networkList={customList}
            chainDistribution={chainDistribution}
            previousListLength={mainnetList.length}
          />
        ) : null}

        <NetworkList
          title="Testnets"
          value={value}
          networks={networks}
          networkList={testnetList}
          chainDistribution={chainDistribution}
          previousListLength={mainnetList.length + customList.length}
        />
      </VStack>
    </form>
  );
}

function SearchView({
  query,
  networks,
  chainDistribution,
}: {
  query: string;
  networks: Networks;
  chainDistribution: ChainDistribution | null;
}) {
  const items = useMemo(() => {
    const allNetworks = [
      ...networks.getMainnets(),
      ...networks.getTestNetworks(),
      ...networks.getCustomNetworks(),
    ];
    return allNetworks.filter(filterNetworksByQuery(query));
  }, [networks, query]);
  return (
    <div
      style={{
        /** To center inner "empty view" state */
        display: 'grid',
        flexGrow: 1,
      }}
    >
      <form method="dialog">
        <NetworkList
          networkList={items}
          networks={networks}
          chainDistribution={chainDistribution}
        />
      </form>
    </div>
  );
}

function AddressNetworkList({
  value,
  networks,
  chainDistribution,
}: {
  value: string;
  networks: Networks;
  chainDistribution: ChainDistribution | null;
}) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(Tab.mainnets);
  const handleTabChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) =>
      setTab(Number(event.currentTarget.value)),
    []
  );
  const debouncedSetSearchParams = useDebouncedCallback(
    useCallback((value: string) => setQuery(value), []),
    300
  );

  const focusSearchInput = useCallback(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  const selectNextNetwork = useCallback(() => {
    const activeElement = document.activeElement as
      | HTMLInputElement
      | HTMLButtonElement;
    let index: number | null = null;
    if (activeElement === searchRef.current) {
      index = -1;
    }
    if (activeElement?.dataset?.class === LIST_ITEM_CLASS) {
      index = Number((activeElement as HTMLButtonElement).dataset.index);
    }
    if (index != null) {
      const nextNetwork = document.querySelector<HTMLButtonElement>(
        `button[data-class='${LIST_ITEM_CLASS}'][data-index='${index + 1}']`
      );
      if (nextNetwork) {
        nextNetwork.focus();
      }
    }
  }, []);

  const selectPrevNetwork = useCallback(() => {
    const activeElement = document.activeElement as
      | HTMLInputElement
      | HTMLButtonElement;
    let index: number | null = null;
    if (activeElement?.dataset?.class === LIST_ITEM_CLASS) {
      index = Number((activeElement as HTMLButtonElement).dataset.index);
    }
    if (index != null && index > 0) {
      const prevNetwork = document.querySelector<HTMLButtonElement>(
        `button[data-class='${LIST_ITEM_CLASS}'][data-index='${index - 1}']`
      );
      if (prevNetwork) {
        prevNetwork.focus();
      }
    }
    if (index === 0) {
      focusSearchInput();
    }
  }, [focusSearchInput]);

  return (
    <>
      <KeyboardShortcut combination="ctrl+f" onKeyDown={focusSearchInput} />
      <KeyboardShortcut combination="cmd+f" onKeyDown={focusSearchInput} />
      <KeyboardShortcut combination="ArrowUp" onKeyDown={selectPrevNetwork} />
      <KeyboardShortcut combination="ArrowDown" onKeyDown={selectNextNetwork} />
      <div
        style={{
          padding: '8px 8px 8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <UIText kind="headline/h3">Networks</UIText>
        <HStack gap={0}>
          <Button
            as={UnstyledLink}
            to="/networks"
            kind="ghost"
            title="Network Settings"
            size={40}
            style={{ padding: 8 }}
          >
            <UIText kind="body/accent">Edit</UIText>
          </Button>

          <Button
            as={UnstyledLink}
            to="/networks/create/search"
            kind="ghost"
            title="Add Network"
            size={40}
            style={{ padding: 8 }}
          >
            <AddCircleIcon style={{ display: 'block', marginInline: 'auto' }} />
          </Button>
          <DialogCloseButton />
        </HStack>
      </div>
      <PageColumn>
        <Spacer height={8} />
        <SearchInput
          ref={searchRef}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              selectNextNetwork();
            }
          }}
          autoFocus={true}
          boxHeight={40}
          type="search"
          placeholder="Network name"
          value={searchValue}
          onChange={(event) => {
            debouncedSetSearchParams(event.currentTarget.value);
            setSearchValue(event.currentTarget.value);
          }}
        />
        <Spacer height={16} />
        {query ? (
          <SearchView
            query={query}
            networks={networks}
            chainDistribution={chainDistribution}
          />
        ) : (
          <SectionView
            tab={tab}
            onTabChange={handleTabChange}
            networks={networks}
            value={value}
            chainDistribution={chainDistribution}
          />
        )}
        <Spacer height={8} />
        <div
          style={{
            height: 8,
            width: '100%',
            borderTop: '2px solid var(--neutral-200)',
          }}
        />
        <SurfaceList
          style={{ paddingBlock: 0 }}
          items={[
            {
              key: 'Add network',
              style: { padding: 0 },
              pad: false,
              component: (
                <SurfaceItemLink
                  to="/networks/create/search"
                  style={{ paddingInline: 0 }}
                >
                  <HStack
                    gap={8}
                    alignItems="center"
                    style={{ paddingBlock: 4 }}
                  >
                    <AddCircleIcon
                      style={{ display: 'block', marginInline: 'auto' }}
                    />
                    <UIText kind="body/accent">Add Network</UIText>
                  </HStack>
                </SurfaceItemLink>
              ),
            },
          ]}
        />
        <PageBottom />
      </PageColumn>
    </>
  );
}

export function NetworkSelectDialog({
  value,
  chainDistribution,
}: {
  value: string;
  chainDistribution: ChainDistribution | null;
}) {
  const { networks } = useNetworks();

  if (!networks && !navigator.onLine) {
    return <ViewLoading kind="network" />;
  }
  if (!networks) {
    return <DelayedRender delay={4000}>No Data</DelayedRender>;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        ['--surface-background-color' as string]: 'var(--z-index-1)',
      }}
    >
      <AddressNetworkList
        value={value}
        networks={networks}
        chainDistribution={chainDistribution}
      />
    </div>
  );
}
