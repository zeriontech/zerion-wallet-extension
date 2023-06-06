import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { AddEthereumChainParameter } from 'src/modules/ethereum/types/AddEthereumChainParameter';
import type { EthereumChainConfig } from 'src/modules/ethereum/chains/ChainConfigStore';
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
import { NetworkForm } from '../Networks/NetworkForm';
import { NetworkCreateSuccess } from '../Networks/NetworkCreateSuccess';

function AddChain({
  origin,
  addEthereumChainParameterStringified,
  onReject,
  onSuccess,
}: {
  origin: string;
  addEthereumChainParameterStringified: string;
  onReject: () => void;
  onSuccess: (result: EthereumChainConfig) => void;
}) {
  const hostname = useMemo(() => new URL(origin).hostname, [origin]);
  const addEthereumChainParameter = useMemo(
    () =>
      JSON.parse(
        addEthereumChainParameterStringified
      ) as AddEthereumChainParameter,
    [addEthereumChainParameterStringified]
  );
  const addEthereumChainMutation = useMutation({
    mutationFn: (param: NetworkConfig) => {
      return walletPort.request('addEthereumChain', {
        values: [param],
        origin,
      });
    },
    onSuccess: (result) => onSuccess(result),
  });
  const { networks } = useNetworks();
  const restrictedChainIds = useMemo(() => {
    return networks
      ? new Set(networks.getAllNetworks().map((n) => n.external_id))
      : null;
  }, [networks]);
  if (!restrictedChainIds) {
    return <ViewLoading kind="network" />;
  }
  return (
    <PageColumn>
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
            Suggests you add this network
          </UIText>
        </VStack>
      </div>
      <Spacer height={16} />
      <NetworkForm
        network={toNetworkConfig(addEthereumChainParameter)}
        submitText="Add"
        isSubmitting={addEthereumChainMutation.isLoading}
        onCancel={onReject}
        onSubmit={(result) => {
          addEthereumChainMutation.mutate(result);
        }}
        restrictedChainIds={restrictedChainIds}
        disabledFields={null}
      />
      <PageBottom />
    </PageColumn>
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
  const [result, setResult] = useState<EthereumChainConfig | null>(null);
  useBackgroundKind({ kind: 'white' });

  if (result) {
    return <NetworkCreateSuccess result={result} onDone={onDone} />;
  }
  return (
    <AddChain
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
  return (
    <AddEthereumChainContent
      addEthereumChainParameterStringified={addEthereumChainParameter}
      origin={origin}
      onReject={useCallback(() => windowPort.reject(windowId), [windowId])}
      onDone={useCallback(() => windowPort.confirm(windowId, null), [windowId])}
    />
  );
}
