import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RenderArea } from 'react-area';
import { useAddressPortfolioDecomposition } from 'defi-sdk';
import { useMutation } from '@tanstack/react-query';
import {
  NavigationType,
  Route,
  Routes,
  useNavigate,
  useNavigationType,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { isTruthy } from 'is-truthy-ts';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { Networks as NetworksModule } from 'src/modules/networks/Networks';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { invariant } from 'src/shared/invariant';
import {
  Background,
  useBackgroundKind,
  whiteBackgroundKind,
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
import { useDebouncedCallback } from 'src/ui/shared/useDebouncedCallback';
import { SearchInput } from 'src/ui/ui-kit/Input/SearchInput';
import { BottomSheetDialog } from 'src/ui/ui-kit/ModalDialogs/BottomSheetDialog';
import type { HTMLDialogElementInterface } from 'src/ui/ui-kit/ModalDialogs/HTMLDialogElementInterface';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { showConfirmDialog } from 'src/ui/ui-kit/ModalDialogs/showConfirmDialog';
import type { ChainDistribution } from 'src/ui/shared/requests/PortfolioValue/ChainValue';
import type { NetworkGroups } from 'src/ui/components/NetworkSelectDialog/createNetworkGroups';
import { createGroups } from 'src/ui/components/NetworkSelectDialog/createNetworkGroups';
import { AddNetworkLink } from 'src/ui/components/NetworkSelectDialog/AddNetworkLink';
import { useSearchKeyboardNavigation } from 'src/ui/components/NetworkSelectDialog/useSearchKeyboardNavigation';
import { LIST_ITEM_CLASS } from 'src/ui/components/NetworkSelectDialog/constants';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import { toAddEthereumChainParameter } from 'src/modules/networks/helpers';
import { usePreferences } from 'src/ui/features/preferences';
import { BACKEND_NETWORK_ORIGIN } from 'src/modules/ethereum/chains/constants';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useWalletAddresses } from './shared/useWalletAddresses';
import { NetworkCreateSuccess } from './NetworkCreateSuccess';
import { createEmptyChainConfig } from './shared/createEmptyChainConfig';
import { SearchResults } from './shared/SearchResults';
import { NetworkList } from './shared/NetworkList';
import { NetworkForm } from './NetworkForm';

async function updateNetworks() {
  const networksStore = await getNetworksStore();
  networksStore.update();
}

type SaveChainConfigParams = {
  chain: string;
  chainConfig: AddEthereumChainParameter;
  prevChain: string | null;
};

async function saveChainConfig({
  chain,
  chainConfig,
  prevChain,
}: SaveChainConfigParams) {
  return walletPort.request('addEthereumChain', {
    values: [chainConfig],
    origin: isCustomNetworkId(chain) ? INTERNAL_ORIGIN : BACKEND_NETWORK_ORIGIN,
    chain,
    prevChain,
  });
}

function NetworkCreatePage() {
  const chainConfig = useMemo(createEmptyChainConfig, []);
  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const saveMutation = useMutation({
    mutationFn: async (params: SaveChainConfigParams) => {
      const result = await saveChainConfig(params);
      await updateNetworks();
      return result;
    },
  });
  useBackgroundKind({ kind: 'white' });
  const { networks } = useNetworks();
  const restrictedChainIds = useMemo(() => {
    return networks
      ? new Set(
          networks
            .getNetworks()
            .map((n) => NetworksModule.getChainId(n))
            .filter(isTruthy)
        )
      : null;
  }, [networks]);
  if (!restrictedChainIds) {
    return <ViewLoading kind="network" />;
  }
  if (saveMutation.isSuccess) {
    return (
      <>
        <NavigationTitle
          title={null}
          documentTitle={`Create Network: ${saveMutation.data.value.chainName}`}
        />
        <NetworkCreateSuccess
          paddingTop={24}
          chainConfig={saveMutation.data.value}
          onDone={() => {
            goBack();
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
        chainConfig={chainConfig}
        onSubmit={(chainStr, value) =>
          saveMutation.mutate({
            chain: chainStr,
            chainConfig: value,
            prevChain: null,
          })
        }
        isSubmitting={saveMutation.isLoading}
        onCancel={goBack}
        restrictedChainIds={restrictedChainIds}
        disabledFields={null}
      />
      <PageBottom />
    </PageColumn>
  );
}

const FORBIDDEN_FIELDS = new Set([
  'chainId',
  'nativeCurrency.decimals',
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

function NetworkPage() {
  const { chain: chainStr } = useParams();
  invariant(chainStr, 'chain parameter is required for this view');
  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(createChain(chainStr));
  const dialogRef = useRef<HTMLDialogElementInterface | null>(null);

  const {
    isCustomNetwork,
    isSavedNetwork,
    isVisitedNetwork,
    isSupportsPositions,
  } = useMemo(() => {
    const chain = createChain(chainStr);
    return {
      isCustomNetwork: isCustomNetworkId(chainStr),
      isSavedNetwork: networks?.isSavedLocallyChain(chain),
      isVisitedNetwork: networks?.isVisitedChain(chain),
      isSupportsPositions: networks?.supports('positions', chain),
    };
  }, [networks, chainStr]);

  const restrictedChainIds = useMemo(() => {
    const set = new Set(
      networks
        ?.getNetworks()
        .map((n) => NetworksModule.getChainId(n))
        .filter(isTruthy)
    );
    const chainId = network ? NetworksModule.getChainId(network) : null;
    if (chainId) {
      set.delete(chainId);
    }
    return set;
  }, [network, networks]);

  const saveMutation = useMutation({
    mutationFn: async (params: SaveChainConfigParams) => {
      await saveChainConfig(params);
      await updateNetworks();
    },
    onSuccess: goBack,
  });
  const removeMutation = useMutation({
    mutationFn: async (network: NetworkConfig) => {
      await walletPort.request('removeEthereumChain', { chain: network.id });
      await updateNetworks();
    },
    onSuccess: goBack,
  });
  const resetMutation = useMutation({
    mutationFn: async (network: NetworkConfig) => {
      await walletPort.request('resetEthereumChain', { chain: network.id });
      await updateNetworks();
    },
    onSuccess: goBack,
  });
  const removeFromVisitedMutation = useMutation({
    mutationFn: async (network: NetworkConfig) => {
      await walletPort.request('removeVisitedEthereumChain', {
        chain: network.id,
      });
      await updateNetworks();
    },
    onSuccess: goBack,
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
          title={
            network.name ||
            network.id ||
            NetworksModule.getChainId(network) ||
            ''
          }
          elementEnd={
            isCustomNetwork ? (
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
          chain={chainStr}
          chainConfig={toAddEthereumChainParameter(network)}
          onSubmit={(id, value) =>
            saveMutation.mutate({
              chain: id,
              chainConfig: value,
              prevChain: network.id,
            })
          }
          isSubmitting={saveMutation.isLoading}
          onReset={
            isSavedNetwork && !isCustomNetwork
              ? () => resetMutation.mutate(network)
              : undefined
          }
          onRemoveFromVisited={
            // we show networks with supported positions based on the balance
            isVisitedNetwork && !isSupportsPositions
              ? () => removeFromVisitedMutation.mutate(network)
              : undefined
          }
          onCancel={goBack}
          footerRenderArea={footerRenderArea}
          disabledFields={isCustomNetwork ? null : FORBIDDEN_FIELDS}
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

function WalletNetworkList({
  networks,
  groups,
}: {
  networks: NetworksModule;
  groups: NetworkGroups;
}) {
  return (
    <>
      <VStack gap={8}>
        {groups.map((group, index) =>
          group.items.length ? (
            <NetworkList
              key={group.key}
              title={group.name}
              networks={networks}
              networkList={group.items}
              previousListLength={groups[index - 1]?.items.length || 0}
            />
          ) : null
        )}
      </VStack>
      <Spacer height={8} />
      <AddNetworkLink />
      <PageBottom />
    </>
  );
}

function NetworksView({
  networks,
  chainDistribution,
  testnetMode,
  autoFocusSearch,
  loading,
}: {
  networks: NetworksModule | null;
  chainDistribution: ChainDistribution | null;
  testnetMode: boolean;
  autoFocusSearch: boolean;
  loading: boolean;
}) {
  const [params, setSearchParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const query = params.get('query');
  const [inputValue, setInputValue] = useState(query || '');
  useBackgroundKind(whiteBackgroundKind);
  const debouncedSetSearchParams = useDebouncedCallback(
    useCallback(
      (value: string) =>
        setSearchParams(value ? [['query', value]] : [], { replace: true }),
      [setSearchParams]
    ),
    300
  );
  const groups = useMemo(() => {
    if (!networks) {
      return [];
    }
    return createGroups({
      networks,
      chainDistribution,
      testnetMode,
      sortMainNetworksType: 'alphabetical',
    });
  }, [networks, chainDistribution, testnetMode]);

  const {
    selectNext: selectNextNetwork,
    selectPrev: selectPrevNetwork,
    focusSearchInput,
  } = useSearchKeyboardNavigation({
    itemClassName: LIST_ITEM_CLASS,
    searchRef,
  });

  if (!networks) {
    return null;
  }
  if (loading) {
    return <ViewLoading />;
  }
  return (
    <>
      <KeyboardShortcut combination="ctrl+f" onKeyDown={focusSearchInput} />
      <KeyboardShortcut combination="cmd+f" onKeyDown={focusSearchInput} />
      <KeyboardShortcut combination="ArrowUp" onKeyDown={selectPrevNetwork} />
      <KeyboardShortcut combination="ArrowDown" onKeyDown={selectNextNetwork} />
      <Background backgroundKind="white">
        <PageColumn>
          <NavigationTitle
            title="Networks"
            elementEnd={
              <Button
                as={UnstyledLink}
                to="/networks/create"
                kind="ghost"
                title="Add Network"
                size={36}
                style={{ paddingInline: 6, justifySelf: 'center' }}
              >
                <AddCircleIcon style={{ display: 'block' }} />
              </Button>
            }
          />
          <Spacer height={16} />
          <SearchInput
            ref={searchRef}
            autoFocus={autoFocusSearch}
            boxHeight={40}
            type="search"
            placeholder="Search"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.currentTarget.value);
              debouncedSetSearchParams(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                selectNextNetwork();
              }
            }}
          />
          <Spacer height={4} />
          {query ? (
            <SearchResults query={query} testnetMode={testnetMode} />
          ) : (
            <WalletNetworkList networks={networks} groups={groups} />
          )}
          <PageBottom />
        </PageColumn>
      </Background>
    </>
  );
}

export function Networks() {
  const { data: addresses } = useWalletAddresses();
  const { preferences } = usePreferences();
  const { currency } = useCurrency();
  const navigationType = useNavigationType();
  const {
    value: portfolioDecomposition,
    isLoading: portfolioDecompositionIsLoading,
  } = useAddressPortfolioDecomposition(
    {
      addresses: addresses || [],
      currency,
    },
    { enabled: Boolean(addresses?.length) }
  );
  const chains = useMemo(
    () => Object.keys(portfolioDecomposition?.chains || {}),
    [portfolioDecomposition]
  );
  const { networks, isLoading } = useNetworks(chains);

  useEffect(() => {
    if (navigationType === NavigationType.Push) {
      window.scrollTo(0, 0);
    }
  }, [navigationType]);

  return (
    <>
      <Routes>
        <Route path="/network/:chain" element={<NetworkPage />} />
        <Route path="/create" element={<NetworkCreatePage />} />
        <Route
          path="/*"
          element={
            <NetworksView
              loading={isLoading || portfolioDecompositionIsLoading}
              networks={networks}
              chainDistribution={portfolioDecomposition}
              testnetMode={Boolean(preferences?.testnetMode?.on)}
              autoFocusSearch={navigationType === NavigationType.Push}
            />
          }
        />
      </Routes>
    </>
  );
}
