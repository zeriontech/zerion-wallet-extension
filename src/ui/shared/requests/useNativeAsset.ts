import { useQuery } from '@tanstack/react-query';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { fungibleToAsset } from 'src/modules/zerion-api/requests/wallet-get-positions';
import type { BackendSourceParams } from 'src/modules/zerion-api/shared';

export function useNativeAssetId(chain: Chain) {
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(chain);
  return network?.native_asset?.id;
}

/**
 * `source` is required and has no default on purpose: this hook used to read the
 * testnet/mainnet channel implicitly from `DefiSdkClientProvider`, so a default
 * here would silently serve mainnet data in testnet mode.
 */
export function useNativeAsset(chain: Chain, { source }: BackendSourceParams) {
  const id = useNativeAssetId(chain);
  const { currency } = useCurrency();
  const query = useQuery({
    queryKey: ['assetListFungibles/nativeAsset', id, currency, source],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      const response = await ZerionAPI.assetListFungibles(
        { fungibleIds: [id], currency },
        { source }
      );
      const fungible = response.data.find((item) => item.id === id);
      return fungible ? fungibleToAsset(fungible) : null;
    },
    enabled: Boolean(id),
    staleTime: 20000,
  });
  return {
    ...query,
    isLoading: query.isInitialLoading,
    value: query.data ?? null,
  };
}
