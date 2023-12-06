import { useQuery } from '@tanstack/react-query';
import type { Networks } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.background';
import type { Chain } from 'src/modules/networks/Chain';
import { fetchNativeEvmPosition } from './fetchNativeEvmPosition';

async function getEvmAddressPositions({
  address,
  chainId,
  networks,
}: {
  address: string;
  chainId: string;
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
      const networks = await networksStore.load();
      const chainId = networks.getNetworkByName(chain)?.external_id;
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
