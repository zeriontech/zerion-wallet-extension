import { useAssetsPrices } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';

export function useNativeAssetId(chain: Chain) {
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(chain);
  return network?.native_asset?.id;
}

export function useNativeAsset(chain: Chain) {
  const id = useNativeAssetId(chain);
  const { currency } = useCurrency();
  const entry = useAssetsPrices(
    {
      asset_codes: [id].filter(isTruthy),
      currency,
    },
    { enabled: Boolean(id) }
  );
  return { ...entry, value: id ? entry.data?.prices[id] : null };
}
