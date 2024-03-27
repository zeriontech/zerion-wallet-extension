import { isTruthy } from 'is-truthy-ts';
import { createChain } from 'src/modules/networks/Chain';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import type { ChainDistribution } from 'src/ui/shared/requests/PortfolioValue/ChainValue';

type ListGroup<T> = {
  key: string;
  name: string | null;
  items: T[];
};

export type NetworkGroups = ListGroup<NetworkConfig>[];

export function createGroups({
  networks,
  chainDistribution,
  showTestnets,
}: {
  networks: Networks;
  chainDistribution: ChainDistribution | null;
  showTestnets: boolean;
}): NetworkGroups {
  const mainnetList = networks.getMainnets();
  const testnetList = networks.getTestNetworks();
  const mainNetworkPredicate = (network: NetworkConfig) =>
    chainDistribution?.chains[network.id] ||
    networks.isSavedChain(createChain(network.id));
  return [
    {
      key: 'mainnets',
      name: null,
      items: mainnetList.filter(mainNetworkPredicate),
    },
    showTestnets
      ? {
          key: 'testnets',
          name: 'Test Networks',
          items: testnetList,
        }
      : null,
    {
      key: 'other',
      name: 'Other Networks',
      items: mainnetList.filter((network) => !mainNetworkPredicate(network)),
    },
  ].filter(isTruthy);
}
