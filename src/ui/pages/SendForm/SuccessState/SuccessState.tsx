import React, { useMemo } from 'react';
import type { SendFormState, SendFormView } from '@zeriontech/transactions';
import { UIText } from 'src/ui/ui-kit/UIText';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { invariant } from 'src/shared/invariant';
import { HStack } from 'src/ui/ui-kit/HStack';
import { FEATURE_LOYALTY_FLOW } from 'src/env/config';
import { useRemoteConfigValue } from 'src/modules/remote-config/useRemoteConfigValue';
import { SuccessStateToken } from 'src/ui/shared/forms/SuccessState/SuccessStateToken';
import { SuccessStateLoader } from 'src/ui/shared/forms/SuccessState/SuccessStateLoader';
import { SuccessStateAddress } from 'src/ui/shared/forms/SuccessState/SuccessStateAddress';
import { useActionStatusByHash } from 'src/ui/shared/forms/SuccessState/useActionStatusByHash';
import { SuccessStateNft } from 'src/ui/shared/forms/SuccessState/SuccessStateNft';
import { useBodyStyle } from 'src/ui/components/Background/Background';

export function GasbackDecorated({ value }: { value: number }) {
  return (
    <HStack
      gap={8}
      justifyContent="space-between"
      alignItems="center"
      style={{
        padding: '8px 12px',
        borderRadius: 12,
        background:
          'linear-gradient(90deg, rgba(160, 36, 239, 0.20) 0%, rgba(253, 187, 108, 0.20) 100%)',
      }}
    >
      <UIText kind="small/accent">Gasback</UIText>
      <UIText
        kind="small/accent"
        style={{
          background: 'linear-gradient(90deg, #6C6CF9 0%, #FF7583 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {new Intl.NumberFormat('en').format(value)}
      </UIText>
    </HStack>
  );
}

export interface SendFormSnapshot {
  state: SendFormState;
  tokenItem: SendFormView['tokenItem'];
  nftItem: SendFormView['nftItem'];
}

export function SuccessState({
  sendFormSnapshot,
  gasbackValue,
  hash,
  onDone,
}: {
  sendFormSnapshot: SendFormSnapshot;
  gasbackValue: number | null;
  hash: string | null;
  onDone: () => void;
}) {
  useBodyStyle(
    useMemo(() => ({ ['--url-bar-background' as string]: 'transparent' }), [])
  );

  const { networks } = useNetworks();
  const { tokenItem, nftItem, state } = sendFormSnapshot;
  const { type, tokenChain, nftChain, to } = state;
  const currentChain = type === 'token' ? tokenChain : nftChain;
  invariant(to && currentChain, 'Required Form values are missing');

  const chain = createChain(currentChain);
  const actionStatus = useActionStatusByHash(hash, chain);

  const { data: loyaltyEnabled } = useRemoteConfigValue(
    'extension_loyalty_enabled'
  );
  const FEATURE_GASBACK = loyaltyEnabled && FEATURE_LOYALTY_FLOW === 'on';
  if (!networks) {
    return <ViewLoading />;
  }

  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getNetworkByName(chain)?.icon_url;

  return (
    <SuccessStateLoader
      startItem={
        type === 'token' && tokenItem ? (
          <SuccessStateToken
            iconUrl={tokenItem?.asset.icon_url}
            symbol={tokenItem?.asset.symbol}
            chainName={chainName}
            chainIconUrl={chainIconUrl}
          />
        ) : type === 'nft' && nftItem ? (
          <SuccessStateNft nftItem={nftItem} />
        ) : null
      }
      endItem={<SuccessStateAddress address={to} />}
      status={actionStatus}
      pendingTitle="Transferring"
      failedTitle="Transfer failed"
      dropppedTitle="Transfer cancelled"
      explorerUrl={
        hash ? networks.getExplorerTxUrlByName(chain, hash) : undefined
      }
      confirmedContent={
        gasbackValue && FEATURE_GASBACK ? (
          <GasbackDecorated value={gasbackValue} />
        ) : null
      }
      onDone={onDone}
    />
  );
}
