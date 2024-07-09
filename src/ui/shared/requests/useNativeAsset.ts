import { type Asset, useAssetsPrices } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import { useCurrency } from 'src/modules/currency/useCurrency';
import type { Chain } from 'src/modules/networks/Chain';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export async function getNativeAsset({
  chain,
  currency,
}: {
  chain: Chain;
  currency: string;
}): Promise<Asset | null> {
  const networksStore = await getNetworksStore();
  const { client } = networksStore;
  const networks = await networksStore.load({ chains: [chain.toString()] });
  const id = networks?.getNetworkByName(chain)?.native_asset?.id;
  if (!id) {
    return null;
  }
  return Promise.race([
    new Promise<Asset>((resolve) => {
      client.assetsPrices(
        {
          currency,
          asset_codes: [id],
        },
        {
          method: 'get',
          onData: (value) => {
            resolve(value.prices[id]);
          },
        }
      );
    }),
    rejectAfterDelay(10000, `assetsPrices, ${id}`),
  ]);
}

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
