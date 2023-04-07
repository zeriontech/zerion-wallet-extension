import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Networks } from 'src/modules/networks/Networks';
import { Chain } from 'src/modules/networks/Chain';
import { NetworkIcon } from '../NetworkIcon';

export function NetworkIndicator({
  chain,
  networks,
  size = 20,
}: {
  chain: Chain;
  networks: Networks;
  size?: number;
}) {
  const network = networks.getNetworkByName(chain);
  return (
    <HStack gap={4} alignItems="center">
      <NetworkIcon
        src={network?.icon_url}
        chainId={network?.external_id || ''}
        size={size}
        name={network?.name || null}
      />
      <UIText kind="small/regular">{networks.getChainName(chain)}</UIText>
    </HStack>
  );
}
