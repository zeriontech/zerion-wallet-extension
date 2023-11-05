import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
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
import { PseudoRoute } from 'src/ui/components/PseudoRoute';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import { RenderArea } from 'react-area';
import { PageStickyFooter } from 'src/ui/components/PageStickyFooter';
import { setURLSearchParams } from 'src/ui/shared/setURLSearchParams';
import { NetworkForm } from '../Networks/NetworkForm';
import { NetworkCreateSuccess } from '../Networks/NetworkCreateSuccess';
import { NetworkUpdateSuccess } from '../Networks/NetworkUpdateSuccess';
import { RpcUrlForm } from './RpcUrlForm';
import { RpcUrlHelp } from './RpcUrlHelp';

enum View {
  default = 'default',
  rpcUrlHelp = 'rpcUrlHelp',
}

type AddOrUpdateChainResult =
  | {
      network: NetworkConfig;
      oldNetwork: null;
    }
  | {
      network: NetworkConfig;
      oldNetwork: NetworkConfig;
    };

function AddOrUpdateChain({
  origin,
  addEthereumChainParameterStringified,
  onReject,
  onSuccess,
}: {
  origin: string;
  addEthereumChainParameterStringified: string;
  onReject: () => void;
  onSuccess: (result: AddOrUpdateChainResult) => void;
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

  const newNetwork = toNetworkConfig(addEthereumChainParameter);

  const [isRpcUrlOverwrite, oldNetwork] = useMemo(() => {
    if (!networks?.hasNetworkById(newNetwork.external_id)) {
      return [false, null];
    }
    const existingNetwork = networks.getNetworkById(newNetwork.external_id);
    const existingNetworkRpcUrl =
      existingNetwork.rpc_url_user || existingNetwork.rpc_url_public?.[0];
    const newNetworkRpcUrl = newNetwork.rpc_url_public?.[0];

    const isOverwrite =
      Boolean(existingNetworkRpcUrl && newNetworkRpcUrl) &&
      existingNetworkRpcUrl !== newNetworkRpcUrl;

    return [isOverwrite, existingNetwork ?? null];
  }, [networks, newNetwork]);

  const addEthereumChainMutation = useMutation({
    mutationFn: (param: NetworkConfig) => {
      return walletPort.request('addEthereumChain', {
        values: [param],
        origin,
      });
    },
    onSuccess: (result) =>
      onSuccess({ network: result.value, oldNetwork: null }),
  });

  const updateEthereumChainMutation = useMutation({
    mutationFn: (param: NetworkConfig) => {
      return walletPort.request('updateEthereumChain', {
        values: [param],
        origin,
      });
    },
    onSuccess: () => {
      if (oldNetwork) {
        onSuccess({ network: newNetwork, oldNetwork });
      }
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
          documentTitle={isRpcUrlOverwrite ? 'Update network' : 'Add network'}
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
              {`Suggests you to ${
                isRpcUrlOverwrite ? 'update RPC URL' : 'add this network'
              }`}
            </UIText>
          </VStack>
        </div>
        <Spacer height={16} />
        {isRpcUrlOverwrite && oldNetwork ? (
          <RpcUrlForm
            network={newNetwork}
            oldNetwork={oldNetwork}
            rpcUrlHelpHref={`?${setURLSearchParams(params, {
              view: View.rpcUrlHelp.toString(),
            }).toString()}`}
            isSubmitting={updateEthereumChainMutation.isLoading}
            onCancel={onReject}
            onSubmit={(network) => {
              updateEthereumChainMutation.mutate(network);
            }}
          />
        ) : (
          <NetworkForm
            network={newNetwork}
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
  const [result, setResult] = useState<AddOrUpdateChainResult | null>(null);
  useBackgroundKind({ kind: 'white' });

  if (result) {
    return result.oldNetwork ? (
      <NetworkUpdateSuccess
        network={result.network}
        oldNetwork={result.oldNetwork}
        onClose={onDone}
      />
    ) : (
      <NetworkCreateSuccess network={result.network} onDone={onDone} />
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

export function assertViewParam(param: string): asserts param is View {
  if (param in View === false) {
    throw new Error('Unsupported view parameter');
  }
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

  const view = params.get('view') || View.default;
  assertViewParam(view);

  return (
    <>
      <PseudoRoute
        when={view === View.default}
        component={
          <AddEthereumChainContent
            addEthereumChainParameterStringified={addEthereumChainParameter}
            origin={origin}
            onReject={useCallback(
              () => windowPort.reject(windowId),
              [windowId]
            )}
            onDone={useCallback(
              () => windowPort.confirm(windowId, null),
              [windowId]
            )}
          />
        }
      />
      <PseudoRoute when={view === View.rpcUrlHelp} component={<RpcUrlHelp />} />
    </>
  );
}
