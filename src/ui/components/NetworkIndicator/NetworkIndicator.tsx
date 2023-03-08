import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Networks } from 'src/modules/networks/Networks';
import { Chain } from 'src/modules/networks/Chain';

export function NetworkIndicator({
  chain,
  networks,
  size = 20,
}: {
  chain: Chain;
  networks: Networks;
  size?: number;
}) {
  return (
    <HStack gap={4} alignItems="center">
      <img
        src={networks.getNetworkByName(chain)?.icon_url || ''}
        alt=""
        style={{ width: size, height: size }}
      />
      <UIText kind="small/regular">{networks.getChainName(chain)}</UIText>
    </HStack>
  );
}
