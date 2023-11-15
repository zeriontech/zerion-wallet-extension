import type { AddressPosition } from 'defi-sdk';
import { useQuery } from '@tanstack/react-query';
import { capitalize } from 'capitalize-ts';
import type { Networks } from 'src/modules/networks/Networks';
import { networksStore } from 'src/modules/networks/networks-store.background';
import { ethers } from 'ethers';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { Chain } from 'src/modules/networks/Chain';
import { httpConnectionPort } from '../channels';

function createAddressPosition({
  balance,
  network,
}: {
  balance: string;
  network: NetworkConfig;
}): AddressPosition {
  return {
    chain: network.chain,
    value: null,
    apy: null,
    id: `${network.native_asset?.symbol}-${network.chain}-asset`,
    included_in_chart: false,
    name: 'Asset',
    quantity: balance,
    protocol: null,
    dapp: null,
    type: 'asset',
    is_displayable: true,
    asset: {
      is_displayable: true,
      type: null,
      name: network.native_asset?.name || `${capitalize(network.name)} Token`,
      symbol: network.native_asset?.symbol || '<unknown-symbol>',
      id:
        network.native_asset?.id ||
        network.native_asset?.symbol.toLowerCase() ||
        '<unknown-id>',
      asset_code:
        network.native_asset?.address ||
        network.native_asset?.symbol.toLowerCase() ||
        '<unknown-id>',
      decimals: network.native_asset?.decimals || NaN,
      icon_url: network.icon_url,
      is_verified: false,
      price: null,
      implementations: {
        [network.chain]: {
          address: network.native_asset?.address ?? null,
          decimals: network.native_asset?.decimals || NaN,
        },
      },
    },
    parent_id: null,
  };
}

async function getEvmAddressPositions({
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
  return [createAddressPosition({ balance, network })];
}

export function useEvmAddressPositions({
  address,
  chain,
  suspense = false,
}: {
  address: string | null;
  chain: Chain;
  suspense?: boolean;
}) {
  return useQuery({
    queryKey: ['eth_getBalance', address, chain],
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
    enabled: Boolean(address),
    suspense,
  });
}
