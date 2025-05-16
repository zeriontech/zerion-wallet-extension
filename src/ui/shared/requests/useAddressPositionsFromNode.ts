import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Chain } from 'src/modules/networks/Chain';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { persistentQuery } from './queryClientPersistence';
import { fetchAddressPositionFromRpcNode } from './fetchAddressPositionFromRpcNode';

export function useAddressPositionFromRpcNode({
  address,
  chain,
  staleTime,
  enabled = true,
  suspense = true,
}: {
  address: string;
  chain: Chain;
  staleTime: number;
  enabled?: boolean;
  suspense?: boolean;
}) {
  return useQuery({
    suspense,
    staleTime,
    queryKey: persistentQuery([
      'eth_getBalance/nativeAddressEvmPosition',
      address,
      chain,
    ]),
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const network = await networksStore.fetchNetworkById(chain.toString());
      return fetchAddressPositionFromRpcNode({ address, network });
    },
    enabled: enabled && Boolean(address),
  });
}

export function useAddressPositionsFromNode(params: {
  address: string;
  chain: Chain;
  staleTime: number;
  enabled?: boolean;
  suspense?: boolean;
}) {
  const { data, ...query } = useAddressPositionFromRpcNode(params);
  const positions = useMemo(() => (data ? [data] : data), [data]);
  return { data: positions, ...query };
}
