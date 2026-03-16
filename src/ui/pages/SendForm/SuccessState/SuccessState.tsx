import React from 'react';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { createChain } from 'src/modules/networks/Chain';
import { ViewLoading } from 'src/ui/components/ViewLoading';
import { invariant } from 'src/shared/invariant';
import { SuccessStateToken } from 'src/ui/shared/forms/SuccessState/SuccessStateToken';
import { SuccessStateLoader } from 'src/ui/shared/forms/SuccessState/SuccessStateLoader';
import { SuccessStateAddress } from 'src/ui/shared/forms/SuccessState/SuccessStateAddress';
import { useActionStatusByHash } from 'src/ui/shared/forms/SuccessState/useActionStatusByHash';
import { SuccessStateNft } from 'src/ui/shared/forms/SuccessState/SuccessStateNft';
import { NavigationTitle } from 'src/ui/components/NavigationTitle';
import type { AddressPosition } from 'defi-sdk';
import { useCurrentPosition } from '../shared/useCurrentPosition';
import type { NftId } from '../shared/useNftPosition';
import { useNftPosition } from '../shared/useNftPosition';
import type { SendFormState } from '../shared/SendFormState';

export interface SendFormSnapshot {
  state: SendFormState;
}

export function SuccessState({
  address,
  sendFormSnapshot,
  positions,
  hash,
  onDone,
}: {
  address: string;
  sendFormSnapshot: SendFormSnapshot;
  positions: AddressPosition[];
  hash: string;
  onDone: () => void;
}) {
  const { networks } = useNetworks();
  const { state: formState } = sendFormSnapshot;
  const tokenItem = useCurrentPosition(formState, positions);
  const { type, tokenChain, to, nftId } = formState;
  const chain = tokenChain ? createChain(tokenChain) : null;
  invariant(to && chain, 'Required Form values are missing');
  const { value: nftItem } = useNftPosition({
    address,
    nftId: (nftId as NftId) ?? null,
    chain,
  });

  const actionStatus = useActionStatusByHash(hash);

  if (!networks) {
    return <ViewLoading />;
  }

  const chainName = networks.getChainName(chain);
  const chainIconUrl = networks.getByNetworkId(chain)?.icon_url;

  return (
    <>
      <NavigationTitle urlBar="none" title="Send Success" />
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
        onDone={onDone}
      />
    </>
  );
}
