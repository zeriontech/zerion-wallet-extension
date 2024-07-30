import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Route, Routes, useSearchParams } from 'react-router-dom';
import { RenderArea } from 'react-area';
import { isTruthy } from 'is-truthy-ts';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import {
  toAddEthereumChainParameter,
  toNetworkConfig,
} from 'src/modules/networks/helpers';
import { invariant } from 'src/shared/invariant';
import { useBackgroundKind } from 'src/ui/components/Background/Background';
import { PageBottom } from 'src/ui/components/PageBottom';
import { PageColumn } from 'src/ui/components/PageColumn';
import { PageTop } from 'src/ui/components/PageTop';
import { SiteFaviconImg } from 'src/ui/components/SiteFaviconImg';
import { walletPort, windowPort } from 'src/ui/shared/channels';
import { HStack } from 'src/ui/ui-kit/HStack';
import { Spacer } from 'src/ui/ui-kit/Spacer';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import type { EthereumChainConfig } from 'src/modules/ethereum/chains/types';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { Networks } from 'src/modules/networks/Networks';
import { DelayedRender } from 'src/ui/components/DelayedRender';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { injectChainConfig } from 'src/modules/networks/injectChainConfig';
import { NetworkForm } from '../Networks/NetworkForm';
import { NetworkCreateSuccess } from '../Networks/NetworkCreateSuccess';
import { NetworkUpdateSuccess } from '../Networks/NetworkUpdateSuccess';
import { RpcUrlForm } from './RpcUrlForm';
import { RpcUrlHelp } from './RpcUrlHelp';

interface AddChainResult {
  config: EthereumChainConfig;
  prevChainConfig: AddEthereumChainParameter | null;
}

function AddOrUpdateChain({
  origin,
  addEthereumChainParameterStringified,
  onKeepCurrent,
  onReject,
  onSuccess,
}: {
  origin: string;
  addEthereumChainParameterStringified: string;
  onKeepCurrent: () => void;
  onReject: () => void;
  onSuccess: (value: AddChainResult) => void;
}) {
  const [params] = useSearchParams();
  const hostname = useMemo(() => new URL(origin).hostname, [origin]);
  const addEthereumChainParameter = useMemo(
    () =>
      JSON.parse(
        addEthereumChainParameterStringified
      ) as AddEthereumChainParameter,
    [addEthereumChainParameterStringified]
  );

  const chainId = normalizeChainId(addEthereumChainParameter.chainId);
  const { networks, loadNetworkByChainId } = useNetworks();

  const { data: updatedNetworks, isLoading } = useQuery({
    queryKey: ['loadNetworkByChainId', chainId],
    queryFn: () => loadNetworkByChainId(chainId),
    enabled: Boolean(chainId),
    useErrorBoundary: false,
    suspense: false,
  });

  const { network, prevNetwork } = useMemo(() => {
    const prevNetwork = updatedNetworks?.hasNetworkById(chainId)
      ? updatedNetworks.getNetworkById(chainId) ?? null
      : null;
    const network = prevNetwork
      ? injectChainConfig(prevNetwork, addEthereumChainParameter)
      : toNetworkConfig(addEthereumChainParameter, null);
    return { network, prevNetwork };
  }, [addEthereumChainParameter, updatedNetworks, chainId]);

  const addEthereumChainMutation = useMutation({
    mutationFn: async ({
      networkId,
      param,
    }: {
      networkId: string;
      param: AddEthereumChainParameter;
    }) => {
      const config = await walletPort.request('addEthereumChain', {
        values: [param],
        origin,
        chain: networkId,
        prevChain: null,
      });
      return {
        config,
        prevChainConfig: prevNetwork
          ? toAddEthereumChainParameter(prevNetwork)
          : null,
      };
    },
    onSuccess: async (result) => {
      const networksStore = await getNetworksStore();
      networksStore.update();
      onSuccess(result);
    },
  });

  const restrictedChainIds = useMemo(() => {
    return networks
      ? new Set(
          networks
            .getNetworks()
            .map((n) => Networks.getChainId(n))
            .filter(isTruthy)
        )
      : null;
  }, [networks]);

  if (!restrictedChainIds || isLoading) {
    return <ViewLoading kind="network" />;
  }

  return (
    <>
      <PageColumn>
        <NavigationTitle
          title={null}
          documentTitle={prevNetwork ? 'Update network' : 'Add network'}
        />
        <PageTop />
        <div
          style={{
            padding: 16,
            border: '1px solid var(--neutral-400)',
            borderRadius: 12,
          }}
        >
          <VStack gap={8}>
            <HStack gap={8} alignItems="center">
              <SiteFaviconImg url={origin} alt="" size={32} />
              <UIText kind="headline/h2">{hostname}</UIText>
            </HStack>
            <UIText kind="small/accent" color="var(--neutral-500)">
              {`Suggests you ${
                prevNetwork ? 'update RPC URL' : 'add this network'
              }`}
            </UIText>
          </VStack>
        </div>
        <Spacer height={16} />
        <UIText kind="headline/h1">
          {prevNetwork?.name || Networks.getName(network)}
        </UIText>
        <Spacer height={16} />
        {prevNetwork ? (
          <RpcUrlForm
            network={network}
            prevNetwork={prevNetwork}
            rpcUrlHelpHref={`/addEthereumChain/what-is-rpc-url?${params}`}
            isSubmitting={addEthereumChainMutation.isLoading}
            onKeepCurrent={onKeepCurrent}
            onSubmit={(networkId, result) => {
              addEthereumChainMutation.mutate({
                networkId,
                param: result,
              });
            }}
          />
        ) : (
          <NetworkForm
            chain={network.id}
            chainConfig={addEthereumChainParameter}
            submitText="Add"
            isSubmitting={addEthereumChainMutation.isLoading}
            onCancel={onReject}
            onSubmit={(networkId, result) => {
              addEthereumChainMutation.mutate({
                networkId,
                param: result,
              });
            }}
            restrictedChainIds={restrictedChainIds}
            disabledFields={null}
            footerRenderArea="add-ethereum-chain-footer"
          />
        )}
        <PageBottom />
      </PageColumn>
      <PageStickyFooter>
        {isLoading ? (
          <DelayedRender delay={500}>
            <Spacer height={8} />
            <UIText
              kind="caption/regular"
              color="var(--neutral-500)"
              style={{ textAlign: 'center' }}
            >
              Fetching Additional Network Info
            </UIText>
          </DelayedRender>
        ) : null}
        <Spacer height={16} />
        <RenderArea name="add-ethereum-chain-footer" />
        <PageBottom />
      </PageStickyFooter>
    </>
  );
}

function AddEthereumChainContent({
  origin,
  addEthereumChainParameterStringified,
  onReject,
  onDone,
}: {
  origin: string;
  addEthereumChainParameterStringified: string;
  onReject: () => void;
  onDone: () => void;
}) {
  const [result, setResult] = useState<AddChainResult | null>(null);
  useBackgroundKind({ kind: 'white' });

  if (result) {
    return result.prevChainConfig ? (
      <NetworkUpdateSuccess
        chainConfig={result.config.value}
        prevChainConfig={result.prevChainConfig}
        onClose={onDone}
      />
    ) : (
      <NetworkCreateSuccess chainConfig={result.config.value} onDone={onDone} />
    );
  }

  return (
    <AddOrUpdateChain
      addEthereumChainParameterStringified={
        addEthereumChainParameterStringified
      }
      origin={origin}
      onKeepCurrent={onDone}
      onReject={onReject}
      onSuccess={(result) => setResult(result)}
    />
  );
}

export function AddEthereumChain() {
  const [params] = useSearchParams();
  const origin = params.get('origin');
  const addEthereumChainParameter = params.get('addEthereumChainParameter');
  const windowId = params.get('windowId');
  invariant(origin, 'origin get-parameter is required for this view');
  invariant(windowId, 'windowId get-parameter is required for this view');
  invariant(
    addEthereumChainParameter,
    'addEtheretumChainParameter get-parameter is required for this view'
  );

  const handleReject = useCallback(
    () => windowPort.reject(windowId),
    [windowId]
  );

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <AddEthereumChainContent
              addEthereumChainParameterStringified={addEthereumChainParameter}
              origin={origin}
              onReject={handleReject}
              onDone={useCallback(
                () => windowPort.confirm(windowId, null),
                [windowId]
              )}
            />
          }
        />
        <Route path="/what-is-rpc-url" element={<RpcUrlHelp />} />
      </Routes>
    </>
  );
}
