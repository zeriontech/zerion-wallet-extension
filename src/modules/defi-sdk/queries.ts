import { Asset, AddressPosition, useAssetsPrices } from 'defi-sdk';
import { useMemo } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { Chain } from '../networks/Chain';
import { backgroundCache } from './index';

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

export function useAssetFromCacheOrAPI({
  address,
  isNative,
  chain,
  id,
}:
  | {
      address: string | null;
      isNative: false;
      chain?: undefined;
      id?: undefined;
    }
  | {
      address: string | null;
      isNative: true;
      chain: Chain;
      id: string | null;
    }) {
  const requestAssetId = isNative ? id : address?.toLowerCase();
  const {
    value: assets,
    status,
    isLoading,
  } = useAssetsPrices(
    { currency: 'usd', asset_codes: [requestAssetId || ''] },
    { enabled: Boolean(requestAssetId) }
  );
  const assetFromCache = useMemo(() => {
    if (isNative) {
      return queryCacheForNativeAsset(address, chain);
    } else if (address) {
      return queryCacheForAsset(address);
    }
    return null;
  }, [address, chain, isNative]);
  const responseAsset = requestAssetId ? assets?.[requestAssetId] : null;
  const asset = responseAsset || assetFromCache;
  return { asset, status, isLoading };
}
