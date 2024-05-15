import React, { useCallback, useMemo, useRef, useState } from 'react';
import { isTruthy } from 'is-truthy-ts';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks } from 'src/modules/networks/Networks';
import {
  useNetworks,
  useSearchNetworks,
} from 'src/modules/networks/useNetworks';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Button } from 'src/ui/ui-kit/Button';
import { Media } from 'src/ui/ui-kit/Media';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SurfaceItemButton, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { filterNetworksByQuery } from 'src/modules/ethereum/chains/filterNetworkByQuery';
import type { ChainDistribution } from 'src/ui/shared/requests/PortfolioValue/ChainValue';
import { ChainValue } from 'src/ui/shared/requests/PortfolioValue/ChainValue';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { DialogCloseButton } from 'src/ui/ui-kit/ModalDialogs/DialogTitle/DialogCloseButton';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import AllNetworksIcon from 'jsx:src/ui/assets/all-networks.svg';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { VirtualizedSurfaceList } from 'src/ui/ui-kit/SurfaceList/VirtualizedSurfaceList';
import { DelayedRender } from '../DelayedRender';
import { NetworkIcon } from '../NetworkIcon';
import { PageBottom } from '../PageBottom';
import { PageColumn } from '../PageColumn';
import { ViewLoading } from '../ViewLoading';
import { KeyboardShortcut } from '../KeyboardShortcut';
import { LIST_ITEM_CLASS } from './constants';
import type { NetworkGroups } from './createNetworkGroups';
import { createGroups } from './createNetworkGroups';
import { AddNetworkLink } from './AddNetworkLink';
import { useSearchKeyboardNavigation } from './useSearchKeyboardNavigation';
import { NetworksEmptyView, ShowTestnetsHint } from './NetworksEmptyView';

function NetworkItem({
  index,
  name,
  value,
  selected,
  icon,
  chainDistribution,
}: {
  index: number;
  name: string;
  value: string;
  selected: boolean;
  icon: React.ReactElement;
  chainDistribution: ChainDistribution | null;
}) {
  return (
    <SurfaceItemButton
      data-class={LIST_ITEM_CLASS}
      data-index={index}
      value={value}
      outlined={selected}
      style={{ padding: 0 }}
    >
      <HStack
        gap={4}
        justifyContent="space-between"
        alignItems="center"
        style={{ paddingBlock: 4 }}
      >
        <Media
          image={icon}
          text={
            <UIText
              kind="body/accent"
              color={selected ? 'var(--primary)' : 'var(--black)'}
            >
              {name}
            </UIText>
          }
          vGap={0}
          detailText={null}
        />
        <UIText
          kind="small/regular"
          color={selected ? 'var(--primary)' : 'var(--neutral-500)'}
        >
          {value === NetworkSelectValue.All ||
          value in (chainDistribution?.chains || {}) ? (
            <ChainValue
              chain={
                value === NetworkSelectValue.All ? value : createChain(value)
              }
              chainDistribution={chainDistribution}
            />
          ) : null}
        </UIText>
      </HStack>
    </SurfaceItemButton>
  );
}

function NetworkList({
  title,
  networks,
  networkList,
  value,
  chainDistribution,
  previousListLength = 0,
  showAllNetworksOption,
}: {
  title?: string | null;
  value: string;
  networks: Networks;
  networkList: NetworkConfig[];
  chainDistribution: ChainDistribution | null;
  previousListLength?: number;
  showAllNetworksOption?: boolean;
}) {
  const items = [
    title
      ? {
          key: title,
          pad: false,
          style: { padding: 0 },
          component: (
            <UIText
              kind="small/accent"
              color="var(--neutral-500)"
              style={{ paddingBlock: 8, backgroundColor: 'var(--white)' }}
            >
              {title}
            </UIText>
          ),
        }
      : null,
    showAllNetworksOption
      ? {
          key: NetworkSelectValue.All,
          isInteractive: true,
          pad: false,
          component: (
            <NetworkItem
              index={previousListLength}
              name="All Networks"
              value={NetworkSelectValue.All}
              selected={value === NetworkSelectValue.All}
              chainDistribution={chainDistribution}
              icon={
                <AllNetworksIcon
                  style={{ width: 24, height: 24 }}
                  role="presentation"
                />
              }
            />
          ),
        }
      : null,
    ...networkList.map((network, index) => {
      return {
        key: network.id,
        isInteractive: true,
        pad: false,
        component: (
          <NetworkItem
            index={previousListLength + index + (showAllNetworksOption ? 1 : 0)}
            name={networks.getChainName(createChain(network.id))}
            value={network.id}
            icon={
              <NetworkIcon
                size={24}
                src={network.icon_url}
                chainId={Networks.getChainId(network)}
                name={network.name}
              />
            }
            chainDistribution={chainDistribution}
            selected={network.id === value}
          />
        ),
      };
    }),
  ].filter(isTruthy);

  return items.length > 50 ? (
    <VirtualizedSurfaceList
      style={{
        paddingBlock: 0,
        ['--surface-background-color' as string]: 'transparent',
      }}
      estimateSize={(index) => (index === 0 && title ? 36 : 48)}
      items={items}
      context="dialog"
      stickyFirstElement={Boolean(title)}
    />
  ) : (
    <SurfaceList
      style={{
        paddingBlock: 0,
        ['--surface-background-color' as string]: 'transparent',
      }}
      items={items}
    />
  );
}

function SectionView({
  networks,
  value,
  chainDistribution,
  groups: rawGroups,
  showAllNetworksOption,
}: {
  value: string;
  networks: Networks;
  groups: NetworkGroups;
  chainDistribution: ChainDistribution | null;
  showAllNetworksOption?: boolean;
}) {
  const groups = useMemo(
    () =>
      rawGroups.map((group) => {
        return {
          ...group,
          items: group.items.filter((network) => !network.hidden),
        };
      }),
    [rawGroups]
  );

  return (
    <>
      <form
        method="dialog"
        onSubmit={(e) => {
          e.stopPropagation();
        }}
      >
        <VStack gap={8}>
          {groups.map((group, index) =>
            group.items.length ? (
              <NetworkList
                key={group.key}
                title={group.name}
                value={value}
                networks={networks}
                networkList={group.items}
                chainDistribution={chainDistribution}
                showAllNetworksOption={showAllNetworksOption && index === 0}
                previousListLength={groups[index - 1]?.items.length || 0}
              />
            ) : null
          )}
        </VStack>
      </form>
      <Spacer height={8} />
      <AddNetworkLink />
    </>
  );
}

function SearchView({
  value,
  query,
  chainDistribution,
  showTestnets,
  filterPredicate,
}: {
  value: string;
  query: string;
  chainDistribution: ChainDistribution | null;
  showTestnets: boolean;
  filterPredicate: (network: NetworkConfig) => boolean;
}) {
  const { networks, isLoading } = useSearchNetworks({ query });
  const items = useMemo(() => {
    const allNetworks = showTestnets
      ? networks?.getNetworks().filter(filterPredicate)
      : networks?.getMainnets().filter(filterPredicate);
    return allNetworks?.filter(filterNetworksByQuery(query));
  }, [filterPredicate, query, networks, showTestnets]);
  if (isLoading) {
    return <ViewLoading kind="network" />;
  }
  if (!items?.length) {
    return <NetworksEmptyView showTestnets={showTestnets} />;
  }

  return (
    <>
      <div style={{ flexGrow: 1 }}>
        <form
          method="dialog"
          onSubmit={(e) => {
            e.stopPropagation();
          }}
        >
          {networks ? (
            <NetworkList
              value={value}
              networkList={items}
              networks={networks}
              chainDistribution={chainDistribution}
            />
          ) : null}
        </form>
        <Spacer height={8} />
        <AddNetworkLink />
      </div>
      {showTestnets ? null : (
        <>
          <Spacer height={8} />
          <ShowTestnetsHint />
        </>
      )}
    </>
  );
}

function AddressNetworkList({
  value,
  networks,
  chainDistribution,
  filterPredicate,
  showTestnets,
  showAllNetworksOption,
}: {
  value: string;
  networks: Networks;
  chainDistribution: ChainDistribution | null;
  filterPredicate: (network: NetworkConfig) => boolean;
  showTestnets: boolean;
  showAllNetworksOption?: boolean;
}) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [query, setQuery] = useState('');
  const debouncedSetSearchParams = useDebouncedCallback(
    useCallback((value: string) => setQuery(value), []),
    300
  );

  const groups = useMemo(() => {
    return createGroups({
      networks,
      chainDistribution,
      showTestnets,
      filterPredicate,
      sortMainNetworksType: 'by_distribution',
    });
  }, [filterPredicate, networks, chainDistribution, showTestnets]);

  const {
    selectNext: selectNextNetwork,
    selectPrev: selectPrevNetwork,
    focusSearchInput,
  } = useSearchKeyboardNavigation({
    itemClassName: LIST_ITEM_CLASS,
    searchRef,
  });

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
            size={36}
            style={{ padding: 8 }}
          >
            <UIText kind="small/accent">Edit</UIText>
          </Button>

          <Button
            as={UnstyledLink}
            to="/networks/create"
            kind="ghost"
            title="Add Network"
            size={36}
            style={{ padding: 8 }}
          >
            <AddCircleIcon
              style={{ display: 'block', width: 20, height: 20 }}
            />
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
          placeholder="Search"
          value={searchValue}
          onChange={(event) => {
            debouncedSetSearchParams(event.currentTarget.value);
            setSearchValue(event.currentTarget.value);
          }}
        />
        <Spacer height={16} />
        {query ? (
          <SearchView
            value={value}
            query={query}
            filterPredicate={filterPredicate}
            chainDistribution={chainDistribution}
            showTestnets={showTestnets}
          />
        ) : (
          <SectionView
            groups={groups}
            networks={networks}
            value={value}
            chainDistribution={chainDistribution}
            showAllNetworksOption={showAllNetworksOption}
          />
        )}
        <PageBottom />
      </PageColumn>
    </>
  );
}

export function NetworkSelectDialog({
  value,
  chainDistribution,
  showAllNetworksOption,
  filterPredicate = () => true,
}: {
  value: string;
  chainDistribution: ChainDistribution | null;
  showAllNetworksOption?: boolean;
  filterPredicate?: (network: NetworkConfig) => boolean;
}) {
  const chains = useMemo(
    () => Object.keys(chainDistribution?.chains || {}),
    [chainDistribution]
  );
  const { preferences } = usePreferences();
  const { networks } = useNetworks(chains);

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
        filterPredicate={filterPredicate}
        value={value}
        networks={networks}
        chainDistribution={chainDistribution}
        showAllNetworksOption={showAllNetworksOption}
        showTestnets={Boolean(preferences?.enableTestnets)}
      />
    </div>
  );
}
