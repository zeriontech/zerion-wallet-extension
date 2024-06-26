import { useQuery } from '@tanstack/react-query';
import type { Networks } from 'src/modules/networks/Networks';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import type { Chain } from 'src/modules/networks/Chain';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import { fetchNativeEvmPosition } from './fetchNativeEvmPosition';

async function getEvmAddressPositions({
  address,
  chainId,
  networks,
}: {
  address: string;
  chainId: ChainId;
  networks: Networks;
}) {
  const position = await fetchNativeEvmPosition({ address, chainId, networks });
  return [position];
}

export function useEvmAddressPositions({
  address,
  chain,
  suspense = false,
  enabled = true,
}: {
  address: string | null;
  chain: Chain;
  suspense?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['eth_getBalance/evmAddressPositions', address, chain],
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const networks = await networksStore.load({ chains: [chain.toString()] });
      const chainId = networks.getChainId(chain);
      return !address || !chainId
        ? null
        : getEvmAddressPositions({
            address,
            chainId,
            networks,
          });
    },
    suspense,
    enabled: enabled && Boolean(address),
  });
}
