import { useQuery } from '@tanstack/react-query';
import { isTruthy } from 'is-truthy-ts';
import type { Asset } from 'src/defi-sdk.types';
import type { LocalActionContentRequest } from 'src/modules/ethereum/transactions/addressAction/creators';
import {
  fetchAssetFromAPI,
  getAssetQueryFungibleId,
  type AssetQuery,
} from 'src/modules/ethereum/transactions/addressAction/fetchAssetFromAPI';
import type { NetworksSource } from 'src/modules/zerion-api/shared';
import { queryClient } from 'src/ui/shared/requests/queryClient';

function localActionAssetQueryKey(
  assetQuery: AssetQuery,
  source: NetworksSource
) {
  return [
    'localActionAsset',
    getAssetQueryFungibleId(assetQuery),
    assetQuery.currency,
    source,
  ] as const;
}

export function useLocalActionAsset(
  request: LocalActionContentRequest,
  source: NetworksSource,
  { enabled }: { enabled: boolean }
) {
  return useQuery({
    queryKey: localActionAssetQueryKey(request.assetQuery, source),
    queryFn: () => fetchAssetFromAPI(request.assetQuery, source),
    enabled,
    suspense: false,
    // A failed lookup leaves this one row without an amount; it must not take
    // the whole History view down.
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Words a search query can match on for a local action whose asset may not
 * have been fetched yet: the fungible id always, and name/symbol if some row
 * has already loaded the asset.
 */
export function getLocalActionSearchTerms(
  request: LocalActionContentRequest,
  source: NetworksSource
): string[] {
  const cached = queryClient.getQueryData<Asset | null>(
    localActionAssetQueryKey(request.assetQuery, source)
  );
  return [
    getAssetQueryFungibleId(request.assetQuery),
    cached?.name,
    cached?.symbol,
  ].filter(isTruthy);
}
