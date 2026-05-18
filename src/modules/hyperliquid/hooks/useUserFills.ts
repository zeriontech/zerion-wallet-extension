import { useQuery } from '@tanstack/react-query';
import { perpUserFills } from '../api/requests/perp-user-fills.client';
import type { PerpUserFillsPayload } from '../api/requests/perp-user-fills.types';

export const USER_FILLS_QUERY_KEY = 'hyperliquid/userFills';

export function useUserFills(
  payload: PerpUserFillsPayload,
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
    queryKey: [USER_FILLS_QUERY_KEY, payload],
    queryFn: () => perpUserFills(payload),
    retry: 0,
    suspense,
    enabled: Boolean(enabled && payload.address),
    staleTime: 20_000,
    refetchInterval,
  });
}
