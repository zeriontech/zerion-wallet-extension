import { useAssetsPrices } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import type { Chain } from 'src/modules/networks/Chain';
import { useNetworks } from 'src/modules/networks/useNetworks';

export function useNativeAsset(chain: Chain) {
  const { networks } = useNetworks();
  const network = networks?.getNetworkByName(chain);
  const id = network?.native_asset?.id;
  const entry = useAssetsPrices(
    {
      asset_codes: [id].filter(isTruthy),
      currency: 'usd',
    },
    { enabled: Boolean(id) }
  );
  return { ...entry, value: id ? entry.data?.prices[id] : null };
}
