import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { perpMetaAndAssetCtxs } from '../api/requests/perp-meta-and-asset-ctxs.client';
import type { DexIdentifier } from '../api/requests/perp-dexs.types';
import { META_AND_ASSET_CTXS_QUERY_KEY } from './useMetaAndAssetCtxs';

interface UsePerpAssetCtxsResult {
  isLoading: boolean;
  coinToMarkPx: Map<string, number>;
}

export function usePerpAssetCtxs(
  dexes: DexIdentifier[],
  { enabled = true }: { enabled?: boolean } = {}
): UsePerpAssetCtxsResult {
  const results = useQueries({
    queries: dexes.map((dex) => {
      // Key shape must match `useMetaAndAssetCtxs` exactly so both hooks share
      // one React Query cache entry per DEX (otherwise the Trade page
      // double-fetches `metaAndAssetCtxs`). React Query hashes object keys
      // deterministically, so `{ dexIdentifier }` dedupes across both call sites.
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
    const coinToMarkPx = new Map<string, number>();

    for (const result of results) {
      const data = result.data;
      if (!data) continue;
      const [meta, ctxs] = data;
      const universe = meta.universe;
      for (let i = 0; i < universe.length; i++) {
        const asset = universe[i];
        const ctx = ctxs[i];
        if (!asset || !ctx) continue;
        const markPx = Number(ctx.markPx);
        if (!Number.isNaN(markPx)) {
          coinToMarkPx.set(asset.name, markPx);
        }
      }
    }

    return { isLoading, coinToMarkPx };
  }, [results, enabled]);
}
