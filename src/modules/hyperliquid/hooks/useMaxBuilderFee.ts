import { useQuery } from '@tanstack/react-query';
import { perpMaxBuilderFee } from '../api/requests/perp-max-builder-fee.client';
import type { PerpMaxBuilderFeePayload } from '../api/requests/perp-max-builder-fee.types';

export const MAX_BUILDER_FEE_QUERY_KEY = 'hyperliquid/maxBuilderFee';

export function useMaxBuilderFee(
  payload: PerpMaxBuilderFeePayload,
  {
    suspense = false,
    enabled = true,
  }: { suspense?: boolean; enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [MAX_BUILDER_FEE_QUERY_KEY, payload],
    queryFn: () => perpMaxBuilderFee(payload),
    retry: 0,
    suspense,
    enabled: Boolean(enabled && payload.address && payload.builder),
    staleTime: 60_000,
  });
}
