import { isTruthy } from 'is-truthy-ts';
import { INTERNAL_ORIGIN } from 'src/background/constants';
import { BACKEND_NETWORK_ORIGIN } from 'src/modules/ethereum/chains/constants';
import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Networks } from 'src/modules/networks/Networks';
import type { ChainDistribution } from 'src/ui/shared/requests/PortfolioValue/ChainValue';

type ListGroup<T> = {
  key: string;
  name: string | null;
  items: T[];
};

export type NetworkGroups = ListGroup<NetworkConfig>[];

function compareNetworks(
  a: NetworkConfig,
  b: NetworkConfig,
  chainDistribution: ChainDistribution | null
) {
  const aString = a.name.toString();
  const bString = b.name.toString();
  const aValue =
    chainDistribution?.positions_chains_distribution[a.id.toString()];
  const bValue =
    chainDistribution?.positions_chains_distribution[b.id.toString()];

  if (aValue && bValue) return bValue - aValue;
  if (aValue && !bValue) return -1;
  if (!aValue && bValue) return 1;
  return aString < bString ? -1 : aString > bString ? 1 : 0;
}

export function createGroups({
  networks,
  chainDistribution,
  showTestnets,
  filterPredicate = () => true,
  sortMainNetworksType = 'by_distribution',
}: {
  networks: Networks;
  chainDistribution: ChainDistribution | null;
  showTestnets: boolean;
  filterPredicate?: (network: NetworkConfig) => boolean;
  sortMainNetworksType?: 'alphabetical' | 'by_distribution';
}): NetworkGroups {
  const mainnetList = networks.getMainnets().filter(filterPredicate);
  const allNetworks = networks.getNetworks().filter(filterPredicate);
  const testnetList = networks.getTestNetworks().filter(filterPredicate);
  const mainNetworkPredicate = (network: NetworkConfig) => {
    const origin = networks.getNetworksMetaData()[network.id]?.origin;
    return (
      chainDistribution?.chains[network.id] ||
      isCustomNetworkId(network.id) ||
      (origin &&
        origin !== INTERNAL_ORIGIN &&
        origin !== BACKEND_NETWORK_ORIGIN)
    );
  };
  return [
    {
      key: 'mainnets',
      name: null,
      items: allNetworks
        .filter(mainNetworkPredicate)
        .sort((a, b) =>
          compareNetworks(
            a,
            b,
            sortMainNetworksType === 'by_distribution'
              ? chainDistribution
              : null
          )
        ),
    },
    {
      key: 'other',
      name: 'Other Networks',
      items: mainnetList.filter((network) => !mainNetworkPredicate(network)),
    },
    showTestnets
      ? {
          key: 'testnets',
          name: 'Test Networks',
          items: testnetList.filter(
            (network) => !mainNetworkPredicate(network)
          ),
        }
      : null,
  ].filter(isTruthy);
}
