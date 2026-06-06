import { isCustomNetworkId } from 'src/modules/ethereum/chains/helpers';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { NetworkId } from 'src/modules/networks/NetworkId';
import type { Networks } from 'src/modules/networks/Networks';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import type { NetworkSelectDistribution } from './types';

export type NetworkGroup = {
  key: 'main' | 'other';
  name: string | null;
  items: NetworkConfig[];
};

export type NetworkGroups = NetworkGroup[];

function compareNetworks(
  a: NetworkConfig,
  b: NetworkConfig,
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
  filterPredicate?: (network: NetworkConfig) => boolean;
}): NetworkGroups {
  const allNetworks = networks
    .getDefaultNetworks(standard)
    .filter((item) => Boolean(item.is_testnet) === testnetMode)
    .filter((item) => !item.hidden)
    .filter(filterPredicate);
  const pinnedNetworkId = standard === 'solana' ? NetworkId.Solana : null;
  const otherNetworkPredicate = (network: NetworkConfig) =>
    network.id !== pinnedNetworkId &&
    (!chainDistribution?.chains[network.id] || isCustomNetworkId(network.id));
  return [
    {
      key: 'main',
      name: null,
      items: allNetworks
        .filter((network) => !otherNetworkPredicate(network))
        .sort((a, b) => {
          if (a.id === pinnedNetworkId) return -1;
          if (b.id === pinnedNetworkId) return 1;
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
