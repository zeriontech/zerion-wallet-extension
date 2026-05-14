import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import type { Chain } from 'src/modules/networks/Chain';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import type { FungiblePosition } from 'src/modules/zerion-api/requests/wallet-get-simple-positions';
import { baseToCommon } from 'src/shared/units/convert';
import { persistentQuery } from './queryClientPersistence';
import { fetchAddressPositionFromRpcNode } from './fetchAddressPositionFromRpcNode';

function toFungiblePosition(
  network: NetworkConfig,
  balanceBaseUnits: string,
  currency: string
): FungiblePosition | null {
  const native = network.native_asset;
  if (!native?.id) {
    return null;
  }
  const decimals = Number(native.decimals);
  const quantity = Number.isFinite(decimals)
    ? baseToCommon(new BigNumber(balanceBaseUnits), decimals).toFixed()
    : balanceBaseUnits;

  return {
    id: `${native.id}-${network.id}-asset`,
    amount: {
      currency,
      quantity,
      value: null,
      usdValue: null,
    },
    fungible: {
      id: native.id,
      name: native.name,
      symbol: native.symbol,
      iconUrl: native.icon_url ?? null,
      verified: true,
      new: false,
      implementations: {
        [network.id]: {
          address: native.address,
          decimals,
        },
      },
      meta: {
        circulatingSupply: null,
        totalSupply: null,
        price: null,
        marketCap: null,
        fullyDilutedValuation: null,
        relativeChange1d: null,
        relativeChange30d: null,
        relativeChange90d: null,
        relativeChange365d: null,
      },
    },
    chain: {
      id: network.id,
      name: network.name,
      iconUrl: network.icon_url ?? '',
    },
  };
}

export function useAddressPositionsFromNode2({
  address,
  chain,
  currency,
  staleTime = 1000 * 20,
  enabled = true,
}: {
  address: string;
  chain: Chain;
  currency: string;
  staleTime?: number;
  enabled?: boolean;
}) {
  const query = useQuery({
    queryKey: persistentQuery([
      'fetchAddressPositionFromRpcNode',
      address,
      chain,
    ]),
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const network = await networksStore.fetchNetworkById(chain.toString());
      const raw = await fetchAddressPositionFromRpcNode({ address, network });
      if (!raw) return { network, balance: null as string | null };
      return { network, balance: raw.quantity };
    },
    enabled: enabled && Boolean(address),
    staleTime,
    suspense: false,
  });

  const positions = useMemo<FungiblePosition[]>(() => {
    if (!query.data || query.data.balance == null) return [];
    const fungible = toFungiblePosition(
      query.data.network,
      query.data.balance,
      currency
    );
    return fungible ? [fungible] : [];
  }, [query.data, currency]);

  return {
    data: positions,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
