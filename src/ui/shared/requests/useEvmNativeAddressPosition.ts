import { useQuery } from '@tanstack/react-query';
import type { Networks } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.background';
import { ethers } from 'ethers';
import type { Chain } from 'src/modules/networks/Chain';
import { httpConnectionPort } from '../channels';
import { createAddressPosition } from './useEvmAddressPositions';

async function getEvmNativeAddressPosition({
  address,
  chainId,
  networks,
}: {
  address: string;
  chainId: string;
  networks: Networks;
}) {
  const balanceInHex = await httpConnectionPort.request('eth_getBalance', {
    params: [address, 'latest'],
    context: { chainId },
  });
  const network = networks.getNetworkById(chainId);
  const balance = ethers.BigNumber.from(balanceInHex).toString();
  return createAddressPosition({ balance, network });
}

export function useEvmNativeAddressPosition({
  address,
  chain,
  enabled = true,
}: {
  address: string | null;
  chain: Chain;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['eth_getBalance', address, chain],
    queryFn: async () => {
      const networks = await networksStore.load();
      const chainId = networks.getNetworkByName(chain)?.external_id;
      return !address || !chainId
        ? null
        : getEvmNativeAddressPosition({
            address,
            chainId,
            networks,
          });
    },
    enabled: enabled && Boolean(address),
  });
}
