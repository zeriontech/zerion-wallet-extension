import { useQuery } from 'react-query';
import { memoize } from 'lodash';
import { AddressPosition, Asset, client } from 'defi-sdk';
import { ResponseData as AssetsPricesReponseData } from 'defi-sdk/lib/domains/assetsPrices';
import { backgroundCache } from 'src/modules/defi-sdk';
import { Chain } from 'src/modules/networks/Chain';
import { normalizeAddress } from 'src/shared/normalizeAddress';

type NativeAssetQuery = {
  isNative: true;
  chain: Chain;
  id: string | null;
  address: string | null;
};

type NonNativeAssetQuery = {
  isNative: false;
  chain: Chain;
  id?: undefined;
  address: string | null;
};

export type CachedAssetQuery = NativeAssetQuery | NonNativeAssetQuery;

function normalizeNullableAddress(address: string | null) {
  return address != null ? normalizeAddress(address) : null;
}

function queryCacheForAsset(assetCode: string) {
  const normalizedCode = normalizeAddress(assetCode);
  for (const entry of backgroundCache.map.values()) {
    if (entry.state.value?.positions?.length) {
      for (const position of entry.state.value.positions as AddressPosition[]) {
        if (
          Object.values(position.asset.implementations || {}).some(
            (impl) => normalizeNullableAddress(impl.address) === normalizedCode
          )
        ) {
          return position.asset as Asset;
        }
      }
    }
  }
}

function queryCacheForNativeAsset(address: string | null, chain: Chain) {
  const normalizedAddress = normalizeNullableAddress(address);
  for (const entry of backgroundCache.map.values()) {
    if (entry.state.value?.positions?.length) {
      for (const position of entry.state.value.positions as AddressPosition[]) {
        if (
          Object.entries(position.asset.implementations || {}).some(
            ([chainName, impl]) =>
              chainName === chain.toString() &&
              normalizeNullableAddress(impl.address) === normalizedAddress
          )
        ) {
          return position.asset as Asset;
        }
      }
    }
  }
}

async function fetchAssetsPrices(
  payload: Parameters<typeof client.assetsPrices>[0]
) {
  return new Promise<AssetsPricesReponseData>((resolve) => {
    client.assetsPrices(payload, { onData: (data) => resolve(data.prices) });
  });
}

export async function fetchAssetFromCacheOrAPI({
  address,
  isNative,
  chain,
  id,
}: CachedAssetQuery) {
  const requestAssetId = isNative ? id : normalizeNullableAddress(address);
  const assets = await fetchAssetsPrices({
    asset_codes: [requestAssetId || ''],
    currency: 'usd',
  });

  const getAssetFromCache = memoize(
    (address: string | null, chain: Chain, isNative: boolean) => {
      if (isNative) {
        return queryCacheForNativeAsset(address, chain);
      } else if (address) {
        return queryCacheForAsset(address);
      }
      return null;
    }
  );

  const responseAsset = requestAssetId ? assets?.[requestAssetId] : null;
  return responseAsset || getAssetFromCache(address, chain, isNative);
}

export function useAssetFromCacheOrAPI(query: CachedAssetQuery) {
  return useQuery(
    ['asset', query.address, query.chain.toString(), query.isNative],
    () => fetchAssetFromCacheOrAPI(query),
    {
      suspense: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retryOnMount: false,
    }
  );
}
