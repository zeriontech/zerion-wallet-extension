import React, { useCallback, useMemo } from 'react';
import { useMutation } from 'react-query';
import {
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Chain, createChain } from 'src/modules/networks/Chain';
import { toAddEthereumChainParamer } from 'src/modules/networks/helpers';
import { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type {
  NetworkConfigMetaData,
  Networks as NetworksType,
} from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { invariant } from 'src/shared/invariant';
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
import { NetworkForm } from './NetworkForm';

function NetworkDetail({
  metadata,
  network,
}: {
  metadata: Record<string, NetworkConfigMetaData>;
  network: NetworkConfig;
}) {
  const chainId = network.external_id;
  if (!chainId || !metadata[chainId]) {
    return null;
  }
  const origin =
    metadata[chainId].origin === globalThis.location.origin
      ? null
      : metadata[chainId].origin;
  return (
    <UIText kind="caption/regular" color="var(--neutral-500)">
      {origin ? `${origin} · ` : null}
      Edited{' '}
      {new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(metadata[chainId].updated)}
    </UIText>
  );
}

function NetworkList({
  networks,
  networkList,
}: {
  networks: NetworksType;
  networkList: NetworkConfig[];
}) {
  const metadata = useMemo(() => networks.getNetworksMetaData(), [networks]);
  return (
    <SurfaceList
      items={networkList.map((network) => ({
        key: network.external_id || network.chain,
        to: `/networks/network/${network.chain}`,
        component: (
          <HStack gap={4} justifyContent="space-between" alignItems="center">
            <Media
              image={
                <NetworkIcon // TODO: Create NetworkIcon component
                  size={24}
                  src={network.icon_url}
                  chainId={network.external_id}
                />
              }
              text={networks.getChainName(createChain(network.name))}
              vGap={0}
              detailText={
                <NetworkDetail network={network} metadata={metadata} />
              }
            />

            <ChevronRightIcon style={{ color: 'var(--neutral-400)' }} />
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
    <UIText
      kind="body/regular"
      color="var(--neutral-500)"
      style={{ textAlign: 'center' }}
    >
      No Testnets
    </UIText>
  );
}

function CustomList({ networks }: { networks: NetworksType }) {
  const items = useMemo(() => networks.getCustomNetworks(), [networks]);
  return items?.length ? (
    <NetworkList networks={networks} networkList={items} />
  ) : (
    <UIText
      kind="body/regular"
      color="var(--neutral-500)"
      style={{ textAlign: 'center' }}
    >
      No Custom Networks
    </UIText>
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

function NetworkCreatePage() {
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
    onSuccess() {
      networksStore.update();
      navigate(-1);
    },
  });
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

function NetworkPage() {
  const { chain } = useParams();
  invariant(chain, 'chain parameter is required for this view');
  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(new Chain(chain));
  const chainId = network?.external_id;

  const { isCustomNetwork, isEditedPredefinedNetwork } = useMemo(() => {
    const customNetworks = networks?.getCustomNetworks();
    const metadata = networks?.getNetworksMetaData();
    const isCustomNetwork = customNetworks?.some(
      (item) => item.chain === chainId
    );
    console.log({ metadata });
    let isEditedPredefinedNetwork = false;
    if (metadata && chainId && metadata[chainId]) {
      const { updated, created } = metadata[chainId];
      if (updated !== created) {
        isEditedPredefinedNetwork = true;
      }
    }
    return { isCustomNetwork, isEditedPredefinedNetwork };
  }, [networks, chain]);
  console.log({ isEditedPredefinedNetwork });

  const mutation = useMutation(saveNetworkConfig, {
    onSuccess() {
      networksStore.update();
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
  if (!network) {
    return <ViewLoading kind="network" />;
  }
  return (
    <PageColumn>
      <NavigationTitle
        title={chain}
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
      />
    </PageColumn>
  );
}

function NetworksView() {
  // const { network: currentNetwork, refetch } = useCurrentNetwork();
  const { networks } = useNetworks();
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
      <Input boxHeight={40} type="search" placeholder="Search" />
      <Spacer height={16} />
      <SegmentedControlGroup style={{ paddingTop: 4 }}>
        <SegmentedControlLink to="/networks" end={true}>
          Mainnets
        </SegmentedControlLink>
        <SegmentedControlLink to="/networks/testnets">
          Testnets
        </SegmentedControlLink>
        <SegmentedControlLink to="/networks/custom">
          Custom
        </SegmentedControlLink>
      </SegmentedControlGroup>
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
    </PageColumn>
  );
}
export function Networks() {
  return (
    <Routes>
      <Route path="/network/:chain" element={<NetworkPage />} />
      <Route path="/create" element={<NetworkCreatePage />} />
      <Route path="/*" element={<NetworksView />} />
    </Routes>
  );
}
