import React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  mainNetworksStore,
  testenvNetworksStore,
} from 'src/modules/networks/networks-store.client';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { Networks } from 'src/modules/networks/Networks';
import { walletPort } from 'src/ui/shared/channels';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledButton } from 'src/ui/ui-kit/UnstyledButton';
import PinIcon from 'jsx:src/ui/assets/pin.svg';
import UnpinIcon from 'jsx:src/ui/assets/unpin.svg';

async function updateNetworks() {
  return Promise.all([
    mainNetworksStore.update(),
    testenvNetworksStore.update(),
  ]);
}

export function usePinNetworkMutation() {
  return useMutation({
    mutationFn: async ({ chain, pin }: { chain: string; pin: boolean }) => {
      await walletPort.request(
        pin ? 'pinEthereumChain' : 'unpinEthereumChain',
        { chain }
      );
      await updateNetworks();
    },
  });
}

export function useSetPinnedNetworksMutation() {
  return useMutation({
    mutationFn: async (chains: string[]) => {
      await walletPort.request('setPinnedEthereumChains', { chains });
      await updateNetworks();
    },
  });
}

/** Icon shows the action: `pin` for unpinned networks, `unpin` for pinned */
export function PinNetworkButton({
  chain,
  pinned,
  kind = 'row',
}: {
  chain: string;
  pinned: boolean;
  kind?: 'row' | 'title';
}) {
  const { mutate, isLoading } = usePinNetworkMutation();
  const title = pinned ? 'Unpin network' : 'Pin network';
  const Icon = pinned ? UnpinIcon : PinIcon;
  const onClick = () => {
    if (!isLoading) {
      mutate({ chain, pin: !pinned });
    }
  };
  if (kind === 'title') {
    return (
      <Button
        kind="ghost"
        type="button"
        title={title}
        aria-pressed={pinned}
        size={40}
        onClick={onClick}
      >
        <Icon
          style={{
            display: 'block',
            marginInline: 'auto',
            color: 'var(--neutral-400)',
          }}
        />
      </Button>
    );
  }
  return (
    <UnstyledButton
      type="button"
      title={title}
      aria-pressed={pinned}
      onClick={onClick}
      style={{ display: 'flex', color: 'var(--neutral-400)' }}
    >
      <Icon style={{ width: 20, height: 20 }} />
    </UnstyledButton>
  );
}

/** Row action for the Networks page lists; pinning is offered for EVM networks only */
export function renderPinNetworkAction(networks: Networks) {
  return (network: NetworkInfo) =>
    Networks.isEip155(network) ? (
      <PinNetworkButton
        chain={network.id}
        pinned={networks.isPinned(createChain(network.id))}
      />
    ) : null;
}
