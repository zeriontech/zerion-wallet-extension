import { useQuery } from '@tanstack/react-query';
import { perpMetaAndAssetCtxs } from '../api/requests/perp-meta-and-asset-ctxs.client';
import type { PerpMetaAndAssetCtxsPayload } from '../api/requests/perp-meta-and-asset-ctxs.types';

export const META_AND_ASSET_CTXS_QUERY_KEY = 'hyperliquid/metaAndAssetCtxs';

export function useMetaAndAssetCtxs(
  payload: PerpMetaAndAssetCtxsPayload = {},
  {
    suspense = false,
    enabled = true,
    refetchInterval,
  }: {
    suspense?: boolean;
    enabled?: boolean;
    refetchInterval?: number | false;
  } = {}
) {
  return useQuery({
    queryKey: [META_AND_ASSET_CTXS_QUERY_KEY, payload],
    queryFn: () => perpMetaAndAssetCtxs(payload),
    retry: 0,
    suspense,
    enabled,
    staleTime: 10_000,
    refetchInterval,
  });
}
