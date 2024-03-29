import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RenderArea } from 'react-area';
import { useMutation } from '@tanstack/react-query';
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks as NetworksType } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { invariant } from 'src/shared/invariant';
import {
  Background,
  useBackgroundKind,
} from 'src/ui/components/Background/Background';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { walletPort } from 'src/ui/shared/channels';
import AddCircleIcon from 'jsx:src/ui/assets/add-circle-outlined.svg';
import TrashIcon from 'jsx:src/ui/assets/trash.svg';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { PageBottom } from 'src/ui/components/PageBottom';
import { VStack } from 'src/ui/ui-kit/VStack';
import { ViewSuspense } from 'src/ui/components/ViewSuspense';
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import { SurfaceItemLink, SurfaceList } from 'src/ui/ui-kit/SurfaceList';
import { NetworkForm } from './NetworkForm';
import { NetworkList } from './shared/NetworkList';
import { SearchResults } from './shared/SearchResults';
import { LocationStateHelperStore } from './shared/LocationStateHelperStore';
import { createEmptyNetwork } from './shared/createEmptyNetwork';
import { NetworkCreateSuccess } from './NetworkCreateSuccess';

async function saveNetworkConfig(network: NetworkConfig) {
  const networks = await networksStore.load();
  const ethereumChainConfig = networks.findEthereumChainById(
    network.external_id
  );
  return walletPort.request('addEthereumChain', {
    values: [network],
    origin: ethereumChainConfig?.origin ?? window.location.origin,
  });
}

function NetworkCreateSearchPage() {
  const { pathname } = useLocation();
  const [params, setSearchParams] = useSearchParams();
  const query = params.get('query') || '';
  const [inputValue, setInputValue] = useState(query);
  const debouncedSetQuery = useDebouncedCallback(
    useCallback(
      (value: string) =>
        setSearchParams(value ? [['query', value]] : [], { replace: true }),
      [setSearchParams]
    ),
    300
  );
  const { networks } = useNetworks();
  return (
    <Background backgroundKind="white">
      <PageColumn
        style={{
          ['--surface-background-color' as string]: 'transparent',
        }}
      >
        <NavigationTitle title="Add Network" />
        <Spacer height={16} />
        <SearchInput
          autoFocus={true}
          boxHeight={40}
          type="search"
          placeholder="Search"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.currentTarget.value);
            debouncedSetQuery(event.currentTarget.value);
          }}
        />
        <Spacer height={16} />
        {networks ? (
          <SearchResults query={query} networks={networks} />
        ) : (
          <ViewLoading kind="network" />
        )}
        <PageBottom />
      </PageColumn>
      <PageStickyFooter>
        <Spacer height={8} />
        <Button
          kind="primary"
          as={UnstyledLink}
          to={`/networks/create?${new URLSearchParams({ from: pathname })}`}
        >
          Add Network Manually
        </Button>
        <PageBottom />
      </PageStickyFooter>
    </Background>
  );
}

function NetworkCreatePage({
  onSuccess,
}: {
  onSuccess: (network: NetworkConfig) => void;
}) {
  const [params] = useSearchParams();
  const isFromSearch = params.get('from') === '/networks/create/search';
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
  const mutation = useMutation({
    mutationFn: saveNetworkConfig,
    onSuccess(_result) {
      networksStore.update();
    },
  });
  useBackgroundKind({ kind: 'white' });
  const { networks } = useNetworks();
  const restrictedChainIds = useMemo(() => {
    return networks
      ? new Set(networks.getAllNetworks().map((n) => n.external_id))
      : null;
  }, [networks]);
  if (!restrictedChainIds) {
    return <ViewLoading kind="network" />;
  }
  if (mutation.isSuccess) {
    return (
      <>
        <NavigationTitle
          title={null}
          documentTitle={`Create Network: ${mutation.data.value.name}`}
        />
        <NetworkCreateSuccess
          paddingTop={24}
          network={mutation.data.value}
          onDone={() => {
            onSuccess(mutation.data.value);
            navigate(isFromSearch ? -2 : -1);
          }}
        />
      </>
    );
  }
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
        restrictedChainIds={restrictedChainIds}
        disabledFields={null}
      />
      <PageBottom />
    </PageColumn>
  );
}

const FORBIDDEN_FIELDS = new Set([
  'external_id',
  'native_asset.decimals',
  'hidden',
]);

function RemoveNetworkConfirmationDialog({
  network,
}: {
  network: NetworkConfig;
}) {
  return (
    <form
      method="dialog"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <VStack gap={8}>
        <UIText kind="headline/h3">Are you sure?</UIText>
        <UIText kind="body/regular">
          {network.name} configuration will be removed
        </UIText>
      </VStack>
      <HStack
        gap={12}
        justifyContent="center"
        style={{ marginTop: 'auto', gridTemplateColumns: '1fr 1fr' }}
      >
        <Button value="cancel" kind="regular">
          Cancel
        </Button>
        <Button kind="danger" value="confirm">
          Remove Network
        </Button>
      </HStack>
    </form>
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
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const { isCustomNetwork, isPredefinedNetwork, isEditedPredefinedNetwork } =
    useMemo(() => {
      const customNetworks = networks?.getCustomNetworks();
      const metadataRecord = networks?.getNetworksMetaData();
      const metadata = metadataRecord?.[chainStr];
      const isCustomNetwork = customNetworks?.some(
        (item) => item.chain === chainStr
      );
      const sourceType = networks?.getSourceType(chain);
      const isPredefined =
        sourceType === 'mainnets' || sourceType === 'testnets';
      const isEditedPredefinedNetwork =
        isPredefined && metadata?.updated !== metadata?.created;
      return {
        isCustomNetwork,
        isEditedPredefinedNetwork,
        isPredefinedNetwork: isPredefined,
      };
    }, [networks, chain, chainStr]);

  const restrictedChainIds = useMemo(() => {
    const set = new Set(networks?.getAllNetworks().map((n) => n.external_id));
    if (network) {
      set.delete(network?.external_id);
    }
    return set;
  }, [network, networks]);
  const mutation = useMutation({
    mutationFn: saveNetworkConfig,
    onSuccess(result) {
      networksStore.update();
      onSuccess(result.value);
      navigate(-1);
    },
  });
  const removeMutation = useMutation({
    mutationFn: (network: NetworkConfig) =>
      walletPort.request('removeEthereumChain', { chain: network.chain }),
    onSuccess() {
      networksStore.update();
      navigate(-1);
    },
  });
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
          title={network.name || network.external_id || network.chain}
          elementEnd={
            isCustomNetwork && !isPredefinedNetwork ? (
              <Button
                kind="ghost"
                title="Remove Network"
                size={40}
                onClick={() => {
                  if (!dialogRef.current) {
                    return;
                  }
                  showConfirmDialog(dialogRef.current).then(() =>
                    removeMutation.mutate(network)
                  );
                }}
              >
                <TrashIcon style={{ display: 'block', marginInline: 'auto' }} />
              </Button>
            ) : undefined
          }
        />
        <BottomSheetDialog ref={dialogRef} height="200px">
          <RemoveNetworkConfirmationDialog network={network} />
        </BottomSheetDialog>
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
          disabledFields={isPredefinedNetwork ? FORBIDDEN_FIELDS : null}
          restrictedChainIds={restrictedChainIds}
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
  const mainnetList = useMemo(() => networks.getMainnets(), [networks]);
  const customList = useMemo(() => networks.getCustomNetworks(), [networks]);
  const testnetList = useMemo(() => networks.getTestNetworks(), [networks]);

  return (
    <VStack gap={8}>
      <NetworkList
        title="Mainnets"
        networks={networks}
        networkList={mainnetList}
      />

      {customList.length ? (
        <NetworkList
          title="Manually Added"
          networks={networks}
          networkList={customList}
        />
      ) : null}

      <NetworkList
        title="Testnets"
        networks={networks}
        networkList={testnetList}
      />
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
                // NOTE:
                // Instead of passing paddingInline: 0 (and paddinBlock: 0 above),
                // maybe this variation can be added as SurfaceList API,
                // e.g. "decorationStyle": "mac-os-big-sur" | "full-bleed" | "full-bleed-rounded"
                style={{ paddingInline: 0 }}
              >
                <HStack gap={8} alignItems="center" style={{ paddingBlock: 4 }}>
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
    </VStack>
  );
}

function NetworksView({
  locationStore,
}: {
  locationStore: LocationStateHelperStore;
}) {
  const [params, setSearchParams] = useSearchParams();
  const query = params.get('query');
  const { itemCreateSuccess } = locationStore.getState();
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
    <Background backgroundKind="white">
      <PageColumn
        style={{ ['--surface-background-color' as string]: 'var(--white)' }}
      >
        <NavigationTitle
          title="Networks"
          elementEnd={
            <Button
              as={UnstyledLink}
              to="/networks/create/search"
              kind="ghost"
              title="Add Network"
              size={36}
            >
              <AddCircleIcon
                style={{ display: 'block', marginInline: 'auto' }}
              />
            </Button>
          }
        />
        <Spacer height={16} />
        <SearchInput
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
            <SearchResults query={query} networks={networks} />
          </ViewSuspense>
        ) : (
          <TabsView networks={networks} />
        )}
        <PageBottom />
      </PageColumn>
    </Background>
  );
}

export function Networks() {
  const [locationStore] = useState(
    () => new LocationStateHelperStore({ itemCreateSuccess: null })
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
        <Route path="/create/search" element={<NetworkCreateSearchPage />} />
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
