import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { Networks } from 'src/modules/networks/Networks';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import type { NetworkSelectDistribution } from './types';

export type NetworkGroup = {
  key: 'pinned' | 'main' | 'other';
  name: string | null;
  items: NetworkInfo[];
};

export type NetworkGroups = NetworkGroup[];

function compareNetworks(
  a: NetworkInfo,
  b: NetworkInfo,
  chainDistribution: NetworkSelectDistribution | null
) {
  const aValue =
    chainDistribution?.positionsChainsDistribution[a.id.toString()];
  const bValue =
    chainDistribution?.positionsChainsDistribution[b.id.toString()];
  if (aValue && bValue) return bValue - aValue;
  if (aValue && !bValue) return -1;
  if (!aValue && bValue) return 1;
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();
  return aName < bName ? -1 : aName > bName ? 1 : 0;
}

export function createGroups2({
  networks,
  standard,
  chainDistribution,
  testnetMode,
  filterPredicate = () => true,
}: {
  standard: BlockchainType | 'all';
  networks: Networks;
  chainDistribution: NetworkSelectDistribution | null;
  testnetMode: boolean;
  filterPredicate?: (network: NetworkInfo) => boolean;
}): NetworkGroups {
  const isEligible = (network: NetworkInfo) =>
    Boolean(network.testnet) === testnetMode &&
    !network.hidden &&
    filterPredicate(network);
  const pinnedNetworks = networks
    .getPinnedNetworks(standard)
    .filter(isEligible);
  const pinnedIds = new Set(pinnedNetworks.map((network) => network.id));
  const allNetworks = networks
    .getDefaultNetworks(standard)
    .filter(isEligible)
    .filter((network) => !pinnedIds.has(network.id));
  const preferredNetworkId = standard === 'solana' ? NetworkId.Solana : null;
  const otherNetworkPredicate = (network: NetworkInfo) =>
    network.id !== preferredNetworkId &&
    (!chainDistribution?.chains[network.id] || isCustomNetworkId(network.id));
  return [
    {
      key: 'pinned',
      name: 'Pinned',
      items: pinnedNetworks,
    },
    {
      key: 'main',
      name: null,
      items: allNetworks
        .filter((network) => !otherNetworkPredicate(network))
        .sort((a, b) => {
          if (a.id === preferredNetworkId) return -1;
          if (b.id === preferredNetworkId) return 1;
          return compareNetworks(a, b, chainDistribution);
        }),
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
