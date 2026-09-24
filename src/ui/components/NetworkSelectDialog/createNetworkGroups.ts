import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { Networks } from 'src/modules/networks/Networks';
import { bringToFront } from 'src/shared/array-mutations';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import type { ChainDistribution } from 'src/ui/shared/requests/PortfolioValue/ChainValue';

type ListGroup<T> = {
  key: string;
  name: string | null;
  items: T[];
};

export type NetworkGroups = ListGroup<NetworkInfo>[];

function compareNetworks(
  a: NetworkInfo,
  b: NetworkInfo,
  chainDistribution: ChainDistribution | null
) {
  const aString = a.name.toString().toLowerCase();
  const bString = b.name.toString().toLowerCase();
  const aValue =
    chainDistribution?.positionsChainsDistribution[a.id.toString()];
  const bValue =
    chainDistribution?.positionsChainsDistribution[b.id.toString()];

  if (aValue && bValue) return bValue - aValue;
  if (aValue && !bValue) return -1;
  if (!aValue && bValue) return 1;
  return aString < bString ? -1 : aString > bString ? 1 : 0;
}

export function createGroups({
  networks,
  standard,
  chainDistribution,
  testnetMode,
  filterPredicate = () => true,
  sortMainNetworksType = 'by_distribution',
}: {
  standard: BlockchainType | 'all';
  networks: Networks;
  chainDistribution: ChainDistribution | null;
  testnetMode: boolean;
  filterPredicate?: (network: NetworkInfo) => boolean;
  sortMainNetworksType?: 'alphabetical' | 'by_distribution';
}): NetworkGroups {
  const isEligible = (network: NetworkInfo) =>
    Boolean(network.testnet) === testnetMode && filterPredicate(network);
  const pinnedNetworks = networks
    .getPinnedNetworks(standard)
    .filter(isEligible);
  const pinnedIds = new Set(pinnedNetworks.map((network) => network.id));
  const allNetworks = networks
    .getDefaultNetworks(standard)
    .filter(isEligible)
    .filter((network) => !pinnedIds.has(network.id));
  const preferredNetworkId = standard === 'solana' ? NetworkId.Solana : null;
  const otherNetworkPredicate = (network: NetworkInfo) => {
    return (
      network.id !== preferredNetworkId &&
      (!chainDistribution?.chains[network.id] || isCustomNetworkId(network.id))
    );
  };
  return [
    {
      key: 'pinned',
      name: 'Pinned',
      items: pinnedNetworks,
    },
    {
      key: 'main',
      name: null,
      items: bringToFront(
        allNetworks
          .filter((network) => !otherNetworkPredicate(network))
          .sort((a, b) =>
            compareNetworks(
              a,
              b,
              sortMainNetworksType === 'by_distribution'
                ? chainDistribution
                : null
            )
          ),
        (item) => item.id === preferredNetworkId
      ),
    },
    {
      key: 'other',
      name: 'Other Networks',
      items: allNetworks
        .filter(otherNetworkPredicate)
        .sort((a, b) => compareNetworks(a, b, null)),
    },
  ];
}
