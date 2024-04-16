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
import type { Networks as NetworksType } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.client';
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
import {
  getChainId,
  toAddEthereumChainParamer,
} from 'src/modules/networks/helpers';
import { valueToHex } from 'src/shared/units/valueToHex';
import { usePreferences } from 'src/ui/features/preferences';
import { useWalletAddresses } from './shared/useWalletAddresses';
import { NetworkCreateSuccess } from './NetworkCreateSuccess';
import { createEmptyChainConfig } from './shared/createEmptyChainConfig';
import { SearchResults } from './shared/SearchResults';
import { NetworkList } from './shared/NetworkList';
import { NetworkForm } from './NetworkForm';

async function saveChainConfig({
  chain,
  chainConfig,
  prevChain,
}: {
  chain: string;
  chainConfig: AddEthereumChainParameter;
  prevChain?: string;
}) {
  const networks = await networksStore.load(
    [chain, prevChain].filter(isTruthy)
  );
  const chainsMetadata = networks.getNetworksMetaData();
  const metadata = chainsMetadata[prevChain || chain];
  if (prevChain && prevChain !== chain) {
    await walletPort.request('switchChainPermissions', { prevChain, chain });
    await walletPort.request('removeEthereumChain', { chain: prevChain });
  }
  return walletPort.request('addEthereumChain', {
    values: [chainConfig],
    origin: metadata?.origin ?? window.location.origin,
    created: metadata?.created ? metadata.created.toString() : undefined,
    chain,
  });
}

function NetworkCreatePage() {
  const chainConfig = useMemo(createEmptyChainConfig, []);
  const navigate = useNavigate();
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const mutation = useMutation({
    mutationFn: saveChainConfig,
    onSuccess() {
      networksStore.update();
    },
  });
  useBackgroundKind({ kind: 'white' });
  const { networks } = useNetworks();
  const restrictedChainIds = useMemo(() => {
    return networks
      ? new Set(
          networks
            .getNetworks()
            .map((n) => getChainId(n))
            .filter(isTruthy)
        )
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
          documentTitle={`Create Network: ${mutation.data.value.chainName}`}
        />
        <NetworkCreateSuccess
          paddingTop={24}
          chainConfig={mutation.data.value}
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
          mutation.mutate({ chain: chainStr, chainConfig: value })
        }
        isSubmitting={mutation.isLoading}
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

  const { isCustomNetwork, isSavedNetwork } = useMemo(() => {
    return {
      isCustomNetwork: isCustomNetworkId(chainStr),
      isSavedNetwork: networks?.isSavedLocallyChain(createChain(chainStr)),
    };
  }, [networks, chainStr]);

  const restrictedChainIds = useMemo(() => {
    const set = new Set(
      networks
        ?.getNetworks()
        .map((n) => getChainId(n))
        .filter(isTruthy)
    );
    const chainId = network ? getChainId(network) : null;
    if (chainId) {
      set.delete(chainId);
    }
    return set;
  }, [network, networks]);

  const mutation = useMutation({
    mutationFn: saveChainConfig,
    onSuccess() {
      networksStore.update();
      navigate(-1);
    },
  });
  const removeMutation = useMutation({
    mutationFn: (network: NetworkConfig) =>
      walletPort.request('removeEthereumChain', { chain: network.id }),
    onSuccess() {
      networksStore.update();
      navigate(-1);
    },
  });
  const resetMutation = useMutation({
    mutationFn: (network: NetworkConfig) =>
      walletPort.request('resetEthereumChain', { chain: network.id }),
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
          title={
            network.name || network.id || valueToHex(getChainId(network) || 0)
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
          chainConfig={toAddEthereumChainParamer(network)}
          onSubmit={(id, value) =>
            mutation.mutate({
              chain: id,
              chainConfig: value,
              prevChain: network.id,
            })
          }
          isSubmitting={mutation.isLoading}
          onReset={
            isSavedNetwork && !isCustomNetwork
              ? () => resetMutation.mutate(network)
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
  networks: NetworksType;
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
  showTestnets,
  autoFocusSearch,
  loading,
}: {
  networks: NetworksType | null;
  chainDistribution: ChainDistribution | null;
  showTestnets: boolean;
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
      showTestnets,
      sortMainNetworksType: 'alphabetical',
    });
  }, [networks, chainDistribution, showTestnets]);

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
            <SearchResults query={query} showTestnets={showTestnets} />
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
  const navigationType = useNavigationType();
  const {
    value: portfolioDecomposition,
    isLoading: portfolioDecompositionIsLoading,
  } = useAddressPortfolioDecomposition(
    {
      addresses: addresses || [],
      currency: 'usd',
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
              showTestnets={Boolean(preferences?.enableTestnets)}
              autoFocusSearch={navigationType === NavigationType.Push}
            />
          }
        />
      </Routes>
    </>
  );
}
