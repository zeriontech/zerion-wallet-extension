import React, { useCallback, useMemo, useState } from 'react';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { Button } from 'src/ui/ui-kit/Button';
import { Media } from 'src/ui/ui-kit/Media';
import IconLeft from 'jsx:src/ui/assets/arrow-left.svg';
import IconClose from 'jsx:src/ui/assets/close.svg';
import ArrowRightIcon from 'jsx:src/ui/assets/arrow-right.svg';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import FiltersIcon from 'jsx:src/ui/assets/filters-24.svg';
import AllNetworksIcon from 'jsx:src/ui/assets/all-networks.svg';
import CheckIcon from 'jsx:src/ui/assets/check.svg';
import {
  DialogButtonValue,
  DialogTitle,
} from 'src/ui/ui-kit/ModalDialogs/DialogTitle';
import {
  SegmentedControlGroup,
  SegmentedControlRadio,
} from 'src/ui/ui-kit/SegmentedControl';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import {
  Item as ListItemType,
  SurfaceItemButton,
  SurfaceList,
} from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { filterNetworksByQuery } from 'src/modules/ethereum/chains/filterNetworkByQuery';
import { NetworkSelectValue } from 'src/modules/networks/NetworkSelectValue';
import { DelayedRender } from '../DelayedRender';
import { NetworkIcon } from '../NetworkIcon';
import { PageBottom } from '../PageBottom';
import { PageColumn } from '../PageColumn';
import { ViewLoading } from '../ViewLoading';

function NetworkList({
  networks,
  networkList,
  value,
}: {
  value?: string;
  networks: Networks;
  networkList: NetworkConfig[];
}) {
  return (
    <SurfaceList
      items={networkList.map((network) => ({
        key: network.external_id || network.chain,
        isInteractive: true,
        pad: false,
        component: (
          <SurfaceItemButton value={network.chain}>
            <HStack gap={4} justifyContent="space-between" alignItems="center">
              <Media
                image={
                  <NetworkIcon // TODO: Create NetworkIcon component
                    size={24}
                    src={network.icon_url}
                    chainId={network.external_id}
                    name={network.name}
                  />
                }
                text={networks.getChainName(createChain(network.chain))}
                vGap={0}
                detailText={null}
              />

              {network.chain === value ? (
                <CheckIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--primary)',
                  }}
                />
              ) : null}
            </HStack>
          </SurfaceItemButton>
        ),
      }))}
    />
  );
}

function MainNetworkView({
  networks,
  value,
  onOpenMore,
  type,
  mainViewLeadingComponent,
}: {
  networks: Networks;
  value: string;
  onOpenMore: () => void;
  type: 'overview' | 'connection';
  mainViewLeadingComponent?: React.ReactNode;
}) {
  const chain = value === NetworkSelectValue.All ? null : createChain(value);
  const networksItems = useMemo(() => {
    const allItems = networks.getMainnets();
    const selectedItemIndex = chain
      ? allItems.findIndex((item) => item.chain === value)
      : -1;
    const selectedItem = chain ? networks.getNetworkByName(chain) : null;
    const AMOUNT_TO_SHOW = 6;
    const isAmongFirstOnes =
      selectedItemIndex !== -1 && selectedItemIndex < AMOUNT_TO_SHOW;
    if (!selectedItem || isAmongFirstOnes) {
      return allItems.slice(0, AMOUNT_TO_SHOW);
    } else {
      // Include selected item as the last shown item
      return allItems.slice(0, AMOUNT_TO_SHOW - 1).concat(selectedItem);
    }
  }, [networks, chain, value]);

  const options: ListItemType[] = [];
  if (type === 'overview') {
    options.push({
      key: 'all',
      isInteractive: true,
      separatorTop: true,
      pad: false,
      component: (
        <SurfaceItemButton value="all">
          <HStack gap={4} justifyContent="space-between">
            <Media
              image={<AllNetworksIcon style={{ width: 16, height: 16 }} />}
              vGap={0}
              text={<div>All Networks</div>}
              detailText={
                !chain || networks.isSupportedByBackend(chain) ? null : (
                  <UIText kind="caption/regular" color="var(--neutral-500)">
                    Does not include testnets
                  </UIText>
                )
              }
            />

            {value === '' ? (
              <CheckIcon
                style={{
                  width: 20,
                  height: 20,
                  color: 'var(--primary)',
                }}
              />
            ) : null}
          </HStack>
        </SurfaceItemButton>
      ),
    });
  }
  options.push(
    ...networksItems.map((network) => ({
      key: network.external_id || network.chain,
      isInteractive: true,
      separatorTop: true,
      pad: false,
      component: (
        <SurfaceItemButton value={network.chain}>
          <HStack gap={4} justifyContent="space-between">
            <HStack gap={8} alignItems="center">
              <NetworkIcon
                src={network.icon_url}
                chainId={network.external_id}
                size={16}
                name={network.name}
              />

              {networks.getChainName(createChain(network.chain))}
            </HStack>

            {network.chain === value ? (
              <CheckIcon
                style={{
                  width: 20,
                  height: 20,
                  color: 'var(--primary)',
                }}
              />
            ) : null}
          </HStack>
        </SurfaceItemButton>
      ),
    }))
  );

  return (
    <>
      <Spacer height={16} />
      <div style={{ paddingInline: 16 }}>
        {type === 'overview' ? (
          <UIText kind="headline/h3">
            <DialogTitle alignTitle="start" title="Filter by Network" />
          </UIText>
        ) : (
          <form
            method="dialog"
            style={{
              position: 'absolute',
              insetInlineEnd: 8,
              insetBlockStart: 8,
            }}
          >
            <Button
              kind="ghost"
              value={DialogButtonValue.cancel}
              aria-label="Close"
              style={{ padding: 8 }}
              size={40}
            >
              <IconClose
                role="presentation"
                style={{ display: 'block', marginInline: 'auto' }}
              />
            </Button>
          </form>
        )}
      </div>
      {mainViewLeadingComponent}
      <VStack gap={12}>
        <form method="dialog">
          <VStack gap={4}>
            {type === 'overview' ? null : (
              <UIText
                style={{ paddingInline: 16 }}
                kind="small/accent"
                color="var(--neutral-500)"
              >
                Networks
              </UIText>
            )}
            <SurfaceList items={options} style={{ paddingBottom: 0 }} />
          </VStack>
        </form>
        <div style={{ paddingInline: 16 }}>
          <Button
            style={{ width: '100%' }}
            kind="regular"
            type="button"
            onClick={onOpenMore}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              <UIText kind="body/regular">Available networks</UIText>
              <ArrowRightIcon />
            </HStack>
          </Button>
        </div>
      </VStack>
      <PageBottom />
    </>
  );
}

function PseudoRoute({
  when,
  component,
}: {
  when: boolean;
  component: JSX.Element;
}) {
  if (when) {
    return component;
  }
  return null;
}

enum Tab {
  mainnets,
  testnets,
  customList,
}

function TabsView({
  tab,
  networks,
  onTabChange,
  value,
}: {
  tab: Tab;
  value: string;
  networks: Networks;
  onTabChange: (event: React.FormEvent<HTMLInputElement>) => void;
}) {
  const mainnetList = networks.getMainnets();
  const testnetList = useMemo(() => networks.getTestNetworks(), [networks]);
  const customList = useMemo(() => networks.getCustomNetworks(), [networks]);
  return (
    <>
      <SegmentedControlGroup style={{ paddingTop: 4 }}>
        <SegmentedControlRadio
          name="tab"
          value={Tab.mainnets}
          onChange={onTabChange}
          checked={tab === Tab.mainnets}
        >
          Mainnets
        </SegmentedControlRadio>
        <SegmentedControlRadio
          name="tab"
          value={Tab.testnets}
          onChange={onTabChange}
          checked={tab === Tab.testnets}
        >
          Testnets
        </SegmentedControlRadio>
        <SegmentedControlRadio
          name="tab"
          value={Tab.customList}
          onChange={onTabChange}
          checked={tab === Tab.customList}
        >
          Custom
        </SegmentedControlRadio>
      </SegmentedControlGroup>
      <Spacer height={8} />
      <PseudoRoute
        when={tab === Tab.mainnets}
        component={
          <form method="dialog">
            <NetworkList
              value={value}
              networks={networks}
              networkList={mainnetList}
            />
          </form>
        }
      />
      <PseudoRoute
        when={tab === Tab.testnets}
        component={
          <form method="dialog">
            <NetworkList
              value={value}
              networks={networks}
              networkList={testnetList}
            />
          </form>
        }
      />
      <PseudoRoute
        when={tab === Tab.customList}
        component={
          <form method="dialog">
            <NetworkList
              value={value}
              networks={networks}
              networkList={customList}
            />
          </form>
        }
      />
    </>
  );
}

function SearchView({
  query,
  networks,
}: {
  query: string;
  networks: Networks;
}) {
  const items = useMemo(() => {
    const allNetworks = [
      ...networks.getTestNetworks(),
      ...networks.getTestNetworks(),
      ...networks.getCustomNetworks(),
    ];
    return allNetworks.filter(filterNetworksByQuery(query));
  }, [networks, query]);
  return (
    <form method="dialog">
      <NetworkList networkList={items} networks={networks} />
    </form>
  );
}

function CompleteNetworkList({
  value,
  networks,
  onGoBack,
}: {
  value: string;
  networks: Networks;
  onGoBack: () => void;
}) {
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

  return (
    <>
      <div
        style={{ padding: 8, display: 'flex', justifyContent: 'space-between' }}
      >
        <HStack gap={8} alignItems="center">
          <Button
            kind="ghost"
            aria-label="Go back"
            onClick={onGoBack}
            size={40}
            style={{ padding: 8 }}
            type="button"
          >
            <IconLeft
              role="presentation"
              style={{ display: 'block', width: 20, height: 20 }}
            />
          </Button>
          <UIText kind="headline/h3">Available Networks</UIText>
        </HStack>
        <HStack gap={0}>
          <Button
            as={UnstyledLink}
            to="/networks"
            kind="ghost"
            title="Network Settings"
            size={40}
            style={{ padding: 8 }}
          >
            <FiltersIcon style={{ display: 'block', marginInline: 'auto' }} />
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
        </HStack>
      </div>
      <PageColumn>
        <Input
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
          <SearchView query={query} networks={networks} />
        ) : (
          <TabsView
            tab={tab}
            onTabChange={handleTabChange}
            networks={networks}
            value={value}
          />
        )}
        <PageBottom />
      </PageColumn>
    </>
  );
}

enum View {
  main,
  completeList,
}
export function NetworkSelectDialog({
  value,
  type,
  mainViewLeadingComponent,
}: {
  value: string;
  type: 'overview' | 'connection';
  mainViewLeadingComponent?: React.ReactNode;
}) {
  const { networks } = useNetworks();
  const [view, setView] = useState<View>(View.main);

  if (!networks && !navigator.onLine) {
    return <ViewLoading kind="network" />;
  }
  if (!networks) {
    return <DelayedRender delay={4000}>No Data</DelayedRender>;
  }
  return (
    <>
      <PseudoRoute
        when={view === View.main}
        component={
          <MainNetworkView
            type={type}
            value={value}
            networks={networks}
            onOpenMore={() => setView(View.completeList)}
            mainViewLeadingComponent={mainViewLeadingComponent}
          />
        }
      />
      <PseudoRoute
        when={view === View.completeList}
        component={
          <CompleteNetworkList
            value={value}
            networks={networks}
            onGoBack={() => setView(View.main)}
          />
        }
      />
    </>
  );
}
