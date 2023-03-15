import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Store } from 'store-unit';
import { isTruthy } from 'is-truthy-ts';
import { RenderArea } from 'react-area';
import { useMutation, useQuery } from 'react-query';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import groupBy from 'lodash/groupBy';
import { Chain, createChain } from 'src/modules/networks/Chain';
import {
  toAddEthereumChainParamer,
  toNetworkConfig,
} from 'src/modules/networks/helpers';
import { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type {
  NetworkConfigMetaData,
  Networks as NetworksType,
} from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { invariant } from 'src/shared/invariant';
import { intersperce } from 'src/ui/shared/intersperce';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { NetworkIcon } from 'src/ui/components/NetworkIcon';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { walletPort } from 'src/ui/shared/channels';
import ChevronRightIcon from 'jsx:src/ui/assets/chevron-right.svg';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import TrashIcon from 'jsx:src/ui/assets/trash.svg';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Input } from 'src/ui/ui-kit/Input';
import { Media } from 'src/ui/ui-kit/Media';
import {
  SegmentedControlGroup,
  SegmentedControlLink,
} from 'src/ui/ui-kit/SegmentedControl';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { PageFullBleedColumn } from 'src/ui/components/PageFullBleedColumn';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageBottom } from 'src/ui/components/PageBottom';
import { EmptyView } from 'src/ui/components/EmptyView';
import { TextLink } from 'src/ui/ui-kit/TextLink';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { getNetworksBySearch } from 'src/modules/ethereum/chains/requests';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { NetworkForm } from './NetworkForm';

function getOriginUrlFromMetaData(metadata: NetworkConfigMetaData) {
  if (
    metadata.origin === globalThis.location.origin ||
    metadata.origin === 'predefined'
  ) {
    return null;
  }
  try {
    const url = new URL(metadata.origin);
    return url.hostname;
  } catch (error) {
    return metadata.origin;
  }
}

function getUpdatedFromMetadata(metadata: NetworkConfigMetaData) {
  const { updated, created } = metadata;
  return updated === created || updated === 0 ? null : metadata.updated;
}

function NetworkDetail({
  metadata,
  network,
  networks,
}: {
  metadata: Record<string, NetworkConfigMetaData>;
  network: NetworkConfig;
  networks: NetworksType;
}) {
  const chainId = network.external_id;
  const chain = createChain(network.chain);
  const { originUrl, updated, sourceType } = useMemo(() => {
    if (!chainId || !metadata || !metadata[chainId]) {
      return {};
    }
    const value = metadata[chainId];
    return {
      originUrl: getOriginUrlFromMetaData(value),
      updated: getUpdatedFromMetadata(value),
      sourceType: networks.getSourceType(chain),
    };
  }, [chainId, metadata, networks, chain]);
  if (!chainId || !metadata[chainId]) {
    return null;
  }
  const isCustom = sourceType === 'custom';
  return (
    <UIText kind="caption/regular" color="var(--neutral-500)">
      {intersperce(
        [
          originUrl ? (
            <span key={0}>
              Added by{' '}
              <span style={{ color: 'var(--primary)' }}>{originUrl}</span> ·{' '}
            </span>
          ) : null,
          updated && !isCustom ? (
            <span key={1}>
              Edited{' '}
              {new Intl.DateTimeFormat('en', {
                dateStyle: 'medium',
                timeStyle: 'medium',
              }).format(updated)}
            </span>
          ) : null,
        ],
        (key) => (
          <span key={key}> · </span>
        )
      )}
    </UIText>
  );
}

function NetworkList({
  networks,
  networkList,
  getItemTo,
  getItemIcon,
}: {
  networks: NetworksType;
  networkList: NetworkConfig[];
  getItemTo?: (item: NetworkConfig) => string;
  getItemIcon?: (item: NetworkConfig) => React.ReactNode;
}) {
  const metadata = useMemo(() => networks.getNetworksMetaData(), [networks]);
  return (
    <SurfaceList
      items={networkList.map((network) => ({
        key: network.external_id || network.chain,
        to: getItemTo?.(network) ?? `/networks/network/${network.chain}`,
        component: (
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
              text={networks.getChainName(createChain(network.name))}
              vGap={0}
              detailText={
                <NetworkDetail
                  networks={networks}
                  network={network}
                  metadata={metadata}
                />
              }
            />

            {getItemIcon?.(network) ?? (
              <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
            )}
          </HStack>
        ),
      }))}
    />
  );
}

function MainnetList({ networks }: { networks: NetworksType }) {
  return (
    <NetworkList networks={networks} networkList={networks.getNetworks()} />
  );
}

function TestnetList({ networks }: { networks: NetworksType }) {
  const items = useMemo(() => networks.getTestNetworks(), [networks]);
  return items?.length ? (
    <NetworkList networks={networks} networkList={items} />
  ) : (
    <EmptyView
      text={
        <VStack gap={8}>
          <div>No Networks</div>
          <div>
            <TextLink style={{ color: 'var(--primary)' }} to="/networks/create">
              Add First
            </TextLink>
          </div>
        </VStack>
      }
    />
  );
}

function CustomList({ networks }: { networks: NetworksType }) {
  const items = useMemo(() => networks.getCustomNetworks(), [networks]);
  return items?.length ? (
    <NetworkList networks={networks} networkList={items} />
  ) : (
    <EmptyView
      text={
        <VStack gap={8}>
          <div>No Custom Networks</div>
          <div>
            <TextLink style={{ color: 'var(--primary)' }} to="/networks/create">
              Add First
            </TextLink>
          </div>
        </VStack>
      }
    />
  );
}

const createEmptyNetwork = (): NetworkConfig => ({
  chain: '',
  external_id: '',
  explorer_address_url: '',
  explorer_home_url: null,
  explorer_name: null,
  explorer_token_url: null,
  explorer_tx_url: null,
  icon_url: '',
  name: '',
  native_asset: {
    name: '',
    address: null,
    decimals: 18,
    id: '',
    symbol: '',
  },
  rpc_url_internal: null,
  rpc_url_public: null,
  supports_bridge: false,
  supports_sending: true,
  supports_trading: false,
  wrapped_native_asset: null,
});

async function saveNetworkConfig(network: NetworkConfig) {
  const networks = await networksStore.load();
  const ethereumChainConfig = networks.findEthereumChainById(
    network.external_id
  );
  return walletPort.request('addEthereumChain', {
    values: [toAddEthereumChainParamer(network)],
    origin: ethereumChainConfig?.origin ?? window.location.origin,
  });
}

function NetworkCreatePage({
  onSuccess,
}: {
  onSuccess: (network: NetworkConfig) => void;
}) {
  const [params] = useSearchParams();
  const networkStringified = params.get('network');
  const network = useMemo(
    () =>
      networkStringified
        ? (JSON.parse(networkStringified) as NetworkConfig)
        : createEmptyNetwork(),
    [networkStringified]
  );
  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const mutation = useMutation(saveNetworkConfig, {
    onSuccess(result) {
      networksStore.update();
      onSuccess(toNetworkConfig(result.chain));
      navigate(-1);
    },
  });
  useBackgroundKind({ kind: 'white' });
  return (
    <PageColumn>
      <NavigationTitle title="Create Network" />
      <PageTop />
      <NetworkForm
        network={network}
        onSubmit={(value) => mutation.mutate(value)}
        isSubmitting={mutation.isLoading}
        onReset={undefined}
        onCancel={goBack}
      />
    </PageColumn>
  );
}

function NetworkPage({
  onSuccess,
}: {
  onSuccess: (network: NetworkConfig) => void;
}) {
  const { chain: chainStr } = useParams();
  invariant(chainStr, 'chain parameter is required for this view');
  const chain = createChain(chainStr);
  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(chain);
  const chainId = network?.external_id;

  const { isCustomNetwork, isEditedPredefinedNetwork } = useMemo(() => {
    const customNetworks = networks?.getCustomNetworks();
    const metadata = networks?.getNetworksMetaData();
    const isCustomNetwork = customNetworks?.some(
      (item) => item.chain === chainId
    );
    let isEditedPredefinedNetwork = false;
    const sourceType = networks?.getSourceType(chain);
    const isPredefined = sourceType === 'mainnets' || sourceType === 'testnets';
    if (isPredefined && metadata && chainId && metadata[chainId]) {
      const { updated, created } = metadata[chainId];
      if (updated !== created) {
        isEditedPredefinedNetwork = true;
      }
    }
    return { isCustomNetwork, isEditedPredefinedNetwork };
  }, [networks, chainId, chain]);

  const mutation = useMutation(saveNetworkConfig, {
    onSuccess(result) {
      networksStore.update();
      onSuccess(toNetworkConfig(result.chain));
      navigate(-1);
    },
  });
  const removeMutation = useMutation(
    (network: NetworkConfig) =>
      walletPort.request('removeEthereumChain', { chain: network.chain }),
    {
      onSuccess() {
        networksStore.update();
        navigate(-1);
      },
    }
  );
  useBackgroundKind({ kind: 'white' });
  if (!networks && !network) {
    return <ViewLoading kind="network" />;
  } else if (!network) {
    throw new Response(null, { status: 404, statusText: 'Page Not Found' });
  }
  const footerRenderArea = 'pages/network/create:footer';
  return (
    <>
      <PageColumn>
        <NavigationTitle
          title={chainStr}
          elementEnd={
            isCustomNetwork ? (
              <Button
                kind="ghost"
                title="Remove Network"
                size={40}
                onClick={() => removeMutation.mutate(network)}
              >
                <TrashIcon style={{ display: 'block', marginInline: 'auto' }} />
              </Button>
            ) : undefined
          }
        />
        <PageTop />
        <NetworkForm
          network={network}
          onSubmit={(value) => mutation.mutate(value)}
          isSubmitting={mutation.isLoading}
          onReset={
            isEditedPredefinedNetwork
              ? () => removeMutation.mutate(network)
              : undefined
          }
          onCancel={goBack}
          footerRenderArea={footerRenderArea}
        />
      </PageColumn>
      <PageStickyFooter>
        <Spacer height={8} />
        <RenderArea name={footerRenderArea} />
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}

function TabsView({ networks }: { networks: NetworksType }) {
  return (
    <>
      <PageFullBleedColumn padding={false}>
        <SegmentedControlGroup style={{ paddingTop: 4, paddingInline: 16 }}>
          <SegmentedControlLink to="/networks" replace={true} end={true}>
            Mainnets
          </SegmentedControlLink>
          <SegmentedControlLink to="/networks/testnets" replace={true}>
            Testnets
          </SegmentedControlLink>
          <SegmentedControlLink to="/networks/custom" replace={true}>
            Custom
          </SegmentedControlLink>
        </SegmentedControlGroup>
      </PageFullBleedColumn>
      <Spacer height={8} />
      <Routes>
        <Route path="/" element={<MainnetList networks={networks} />} />
        <Route
          path="/testnets"
          element={
            <>
              <TestnetList networks={networks} />
            </>
          }
        />
        <Route
          path="/custom"
          element={
            <>
              <CustomList networks={networks} />
            </>
          }
        />
      </Routes>
    </>
  );
}

function SearchView({
  query,
  networks,
}: {
  query: string;
  networks: NetworksType;
}) {
  const { data: itemsForQuery, isPreviousData } = useQuery(
    ['getNetworksBySearch', query],
    () =>
      getNetworksBySearch({ query }).then((items) =>
        items.map((item) => toNetworkConfig(item))
      ),
    { suspense: false, keepPreviousData: true }
  );
  const { pathname } = useLocation();
  const grouped = useMemo((): null | Array<{
    title: string;
    items: NetworkConfig[];
  }> => {
    if (!itemsForQuery) {
      return null;
    }
    const groups = groupBy(itemsForQuery, (item) => {
      if (
        item.name.toLowerCase().includes('test') ||
        item.rpc_url_public?.includes('test')
      ) {
        return 'testnets';
      }
      return 'mainnets';
    });

    return [
      groups.mainnets ? { title: 'Mainnets', items: groups.mainnets } : null,
      groups.testnets ? { title: 'Testnets', items: groups.testnets } : null,
    ].filter(isTruthy);
  }, [itemsForQuery]);
  if (!query) {
    return <Navigate to={pathname} replace={true} />;
  }
  if (!itemsForQuery) {
    return null;
  }
  if (!grouped || !grouped.length) {
    return <EmptyView text="Nothing found" />;
  }
  return (
    <VStack gap={16} style={isPreviousData ? { opacity: 0.6 } : undefined}>
      {grouped.map(({ title, items }) => (
        <VStack gap={8}>
          <UIText kind="small/accent" color="var(--neutral-600)">
            {title}
          </UIText>
          <NetworkList
            networks={networks}
            networkList={items}
            getItemTo={(item) =>
              networks.hasNetworkById(item.external_id)
                ? `/networks/network/${
                    networks.getNetworkById(item.external_id).chain
                  }`
                : `/networks/create?${new URLSearchParams({
                    network: JSON.stringify(item),
                  })}`
            }
            getItemIcon={(item) =>
              networks.hasNetworkById(item.external_id) ? (
                <CheckIcon
                  style={{
                    width: 20,
                    height: 20,
                    color: 'var(--positive-500)',
                  }}
                  aria-label="Already added"
                />
              ) : undefined
            }
          />
        </VStack>
      ))}
    </VStack>
  );
}

interface LocationStateHelper {
  itemCreateSuccess: Chain | null;
}

function NetworksView({
  locationStore,
}: {
  locationStore: Store<LocationStateHelper>;
}) {
  // const { network: currentNetwork, refetch } = useCurrentNetwork();
  const [params, setSearchParams] = useSearchParams();
  const query = params.get('query');
  const { itemCreateSuccess } = locationStore.getState();
  // if (state?.targetTab) {
  //   navigate(`${pathname}/${state?.targetTab}`, { replace: true });
  //   navigate(-1, { state: 'lol' })
  // }
  const [inputValue, setInputValue] = useState(query || '');
  const debouncedSetSearchParams = useDebouncedCallback(
    useCallback(
      (value: string) =>
        setSearchParams(value ? [['query', value]] : [], { replace: true }),
      [setSearchParams]
    ),
    300
  );
  const { networks } = useNetworks();
  const redirectTo = useMemo(() => {
    if (!itemCreateSuccess || !networks) {
      return null;
    } else if (itemCreateSuccess) {
      const sourceType = networks.getSourceType(itemCreateSuccess);
      return sourceType === 'mainnets'
        ? `/networks`
        : `/networks/${sourceType}`;
    }
  }, [itemCreateSuccess, networks]);
  const navigate = useNavigate();
  useEffect(() => {
    if (redirectTo) {
      locationStore.setState({ itemCreateSuccess: null });
      navigate(redirectTo, { replace: true });
    }
  }, [locationStore, navigate, redirectTo]);
  if (!networks) {
    return null;
  }
  return (
    <PageColumn>
      <NavigationTitle
        title="Networks"
        elementEnd={
          <Button
            as={UnstyledLink}
            to="/networks/create"
            kind="ghost"
            title="Add Network"
            size={40}
          >
            <AddCircleIcon style={{ display: 'block', marginInline: 'auto' }} />
          </Button>
        }
      />
      <Spacer height={16} />
      <Input
        boxHeight={40}
        type="search"
        placeholder="Search"
        value={inputValue}
        onChange={(event) => {
          setInputValue(event.currentTarget.value);
          debouncedSetSearchParams(event.currentTarget.value);
        }}
      />
      <Spacer height={16} />
      {query ? (
        <ViewSuspense>
          <SearchView query={query} networks={networks} />
        </ViewSuspense>
      ) : (
        <TabsView networks={networks} />
      )}
      <PageBottom />
    </PageColumn>
  );
}

// function LocationTracker({ store }: { store: Store<string[]> }) {
//   const { pathname } = useLocation();
//   useEffect(() => {
//     store.setState((entries) => [...entries, pathname]);
//   }, [pathname, store]);
//   return null;
// }

export function Networks() {
  const [locationStore] = useState(
    () => new Store<LocationStateHelper>({ itemCreateSuccess: null })
  );
  const handleMutationSuccess = (network: NetworkConfig) =>
    locationStore.setState({
      itemCreateSuccess: createChain(network.chain),
    });

  return (
    <>
      <Routes>
        <Route
          path="/network/:chain"
          element={<NetworkPage onSuccess={handleMutationSuccess} />}
        />
        <Route
          path="/create"
          element={<NetworkCreatePage onSuccess={handleMutationSuccess} />}
        />
        <Route
          path="/*"
          element={<NetworksView locationStore={locationStore} />}
        />
      </Routes>
    </>
  );
}
