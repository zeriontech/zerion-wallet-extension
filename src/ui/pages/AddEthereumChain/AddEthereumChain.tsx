import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Route, Routes, useSearchParams } from 'react-router-dom';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { toNetworkConfig } from 'src/modules/networks/helpers';
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
import { RenderArea } from 'react-area';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import type { EthereumChainConfig } from 'src/modules/ethereum/chains/ChainConfigStore';
import { valueToHex } from 'src/shared/units/valueToHex';
import { createChain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { Networks } from 'src/modules/networks/Networks';
import { KeyboardShortcut } from 'src/ui/components/KeyboardShortcut';
import { NetworkForm } from '../Networks/NetworkForm';
import { NetworkCreateSuccess } from '../Networks/NetworkCreateSuccess';
import { NetworkUpdateSuccess } from '../Networks/NetworkUpdateSuccess';
import { RpcUrlForm } from './RpcUrlForm';
import { RpcUrlHelp } from './RpcUrlHelp';

interface AddChainResult {
  config: EthereumChainConfig;
  prevNetwork: NetworkConfig | null;
}

function AddOrUpdateChain({
  origin,
  addEthereumChainParameterStringified,
  onReject,
  onSuccess,
}: {
  origin: string;
  addEthereumChainParameterStringified: string;
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

  const { networks } = useNetworks();

  const { network, prevNetwork } = useMemo(() => {
    const chainId = valueToHex(addEthereumChainParameter.chainId);
    const prevNetwork = networks?.getNetworkById(chainId) ?? null;
    const chain = prevNetwork ? createChain(prevNetwork.chain) : null;
    const network = toNetworkConfig(addEthereumChainParameter, chain);
    return { network, prevNetwork };
  }, [addEthereumChainParameter, networks]);

  const addEthereumChainMutation = useMutation({
    mutationFn: async (param: NetworkConfig) => {
      const config = await walletPort.request('addEthereumChain', {
        values: [param],
        origin,
      });
      return { config, prevNetwork };
    },
    onSuccess: (result) => {
      networksStore.update();
      onSuccess(result);
    },
  });

  const restrictedChainIds = useMemo(() => {
    return networks
      ? new Set(networks.getAllNetworks().map((n) => n.external_id))
      : null;
  }, [networks]);

  if (!restrictedChainIds) {
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
            onCancel={onReject}
            onSubmit={(network) => {
              addEthereumChainMutation.mutate(network);
            }}
          />
        ) : (
          <NetworkForm
            network={network}
            submitText="Add"
            isSubmitting={addEthereumChainMutation.isLoading}
            onCancel={onReject}
            onSubmit={(network) => {
              addEthereumChainMutation.mutate(network);
            }}
            restrictedChainIds={restrictedChainIds}
            disabledFields={null}
            footerRenderArea="add-ethereum-chain-footer"
          />
        )}
        <PageBottom />
      </PageColumn>
      <PageStickyFooter>
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
    return result.prevNetwork ? (
      <NetworkUpdateSuccess
        network={result.config.value}
        prevNetwork={result.prevNetwork}
        onClose={onDone}
      />
    ) : (
      <NetworkCreateSuccess network={result.config.value} onDone={onDone} />
    );
  }

  return (
    <AddOrUpdateChain
      addEthereumChainParameterStringified={
        addEthereumChainParameterStringified
      }
      origin={origin}
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
      <KeyboardShortcut combination="esc" onKeyDown={handleReject} />
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
