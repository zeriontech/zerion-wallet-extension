import React from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { createChain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';

export function CurrentNetworkSettingsItem({ chain }: { chain: Chain }) {
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(chain);
  return network && networks ? (
    <VStack gap={0}>
      <HStack gap={8} alignItems="center">
        <img
          src={network.icon_url || ''}
          alt=""
          style={{ width: 16, height: 16 }}
        />

        {networks.getChainName(createChain(network.name))}
      </HStack>
      <UIText
        kind="caption/regular"
        color="var(--neutral-500)"
        style={{
          overflow: 'hidden',
          maxWidth: 336,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {networks && network?.rpc_url_internal
          ? new URL(networks.getRpcUrlInternal(createChain(network.chain)))
              .hostname
          : null}
      </UIText>
    </VStack>
  ) : (
    <span>Network</span>
  );
}
