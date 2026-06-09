import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { perpMetaAndAssetCtxs } from '../api/requests/perp-meta-and-asset-ctxs.client';
import type { PerpMetaAndAssetCtxsResponse } from '../api/requests/perp-meta-and-asset-ctxs.types';
import type { DexIdentifier } from '../api/requests/perp-dexs.types';
import { META_AND_ASSET_CTXS_QUERY_KEY } from './useMetaAndAssetCtxs';

interface UsePerpMarketsResult {
  isLoading: boolean;
  /** Raw `[meta, ctxs]` responses, one per DEX. Feed to `selectPerps`. */
  data: Array<PerpMetaAndAssetCtxsResponse | null | undefined>;
}

/**
 * Fetches `metaAndAssetCtxs` for every DEX and returns the raw responses for
 * `selectPerps` to merge/sort/slice. The query key is identical to
 * `useMetaAndAssetCtxs` / `usePerpAssetCtxs` (`[META_AND_ASSET_CTXS_QUERY_KEY,
 * { dexIdentifier }]`) so all three hooks share one React Query cache entry per
 * DEX — the Markets list piggybacks on the data the overview already fetches
 * rather than issuing its own requests.
 */
export function usePerpMarkets(
  dexList: DexIdentifier[],
  { enabled = true }: { enabled?: boolean } = {}
): UsePerpMarketsResult {
  const results = useQueries({
    queries: dexList.map((dex) => {
      const payload = { dexIdentifier: dex };
      return {
        queryKey: [META_AND_ASSET_CTXS_QUERY_KEY, payload],
        queryFn: () => perpMetaAndAssetCtxs(payload),
        retry: 0,
        staleTime: 25_000,
        refetchInterval: 30_000,
        enabled,
        suspense: false,
      };
    }),
  });

  return useMemo(() => {
    const isLoading = enabled && results.some((r) => r.isLoading);
    const data = results.map((r) => r.data);
    return { isLoading, data };
  }, [results, enabled]);
}
