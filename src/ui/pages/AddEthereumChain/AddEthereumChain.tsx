import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
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
import { Button } from 'src/ui/ui-kit/Button';
import CheckIcon from 'jsx:src/ui/assets/checkmark-checked.svg';
import { noValueDash } from 'src/ui/shared/typography';
import { NetworkForm } from '../Networks/NetworkForm';

function AddChain({
  origin,
  addEthereumChainParameterStringified,
  onReject,
  onSuccess,
}: // onConfirm,
{
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
  const addEthereumChainMutation = useMutation(
    (param: NetworkConfig) => {
      return walletPort.request('addEthereumChain', {
        values: [param],
        origin,
      });
    },
    { onSuccess: (result) => onSuccess(result) }
  );
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
            <SiteFaviconImg
              url={origin}
              alt=""
              style={{ width: 32, height: 32 }}
            />
            <UIText kind="headline/h2">{hostname}</UIText>
          </HStack>
          <UIText kind="small/accent" color="var(--neutral-500)">
            suggests you add blabla
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
      />
      <PageBottom />
    </PageColumn>
  );
}

function ValueCell({ label, value }: { label: string; value: string }) {
  return (
    <VStack gap={4}>
      <UIText kind="small/accent" color="var(--neutral-500)">
        {label}
      </UIText>
      <UIText kind="body/accent">{value}</UIText>
    </VStack>
  );
}

function Success({
  result,
  onDone,
}: {
  result: EthereumChainConfig;
  onDone: () => void;
}) {
  const network = result.value;
  return (
    <PageColumn>
      <Spacer height={64} />
      <CheckIcon
        style={{
          display: 'block',
          marginInline: 'auto',
          width: 60,
          height: 60,
          color: 'var(--positive-500)',
        }}
      />
      <Spacer height={16} />
      <UIText
        kind="headline/h1"
        style={{
          textAlign: 'center',

          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {network.name || network.external_id}
      </UIText>
      <UIText kind="headline/h3" style={{ textAlign: 'center' }}>
        added successfully
      </UIText>
      <Spacer height={32} />
      <VStack gap={8} style={{ textAlign: 'center' }}>
        <ValueCell
          label="RPC URL"
          value={network.rpc_url_internal || noValueDash}
        />
        <ValueCell label="Chain ID" value={network.external_id} />
        <ValueCell
          label="Currency Symbol"
          value={network.native_asset?.symbol ?? noValueDash}
        />
        <ValueCell
          label="Block Explorer URL"
          value={network.explorer_home_url || noValueDash}
        />
      </VStack>
      <Button style={{ marginTop: 'auto' }} onClick={onDone}>
        Close
      </Button>
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
    return <Success result={result} onDone={onDone} />;
  }
  return (
    <AddChain
      addEthereumChainParameterStringified={
        addEthereumChainParameterStringified
      }
      origin={origin}
      onReject={onReject}
      onSuccess={(result) => setResult(result)}
      // onAccept={onAccept}
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
