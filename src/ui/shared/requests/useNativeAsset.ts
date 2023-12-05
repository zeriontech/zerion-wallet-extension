import { type Asset, useAssetsPrices, client } from 'defi-sdk';
import { isTruthy } from 'is-truthy-ts';
import type { Chain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { useNetworks } from 'src/modules/networks/useNetworks';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export async function getNativeAsset({
  chain,
  currency,
}: {
  chain: Chain;
  currency: string;
}): Promise<Asset | null> {
  const networks = await networksStore.load();
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
