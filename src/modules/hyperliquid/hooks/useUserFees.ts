import { useQuery } from '@tanstack/react-query';
import { perpUserFees } from '../api/requests/perp-user-fees.client';
import type { PerpUserFeesPayload } from '../api/requests/perp-user-fees.types';

export const USER_FEES_QUERY_KEY = 'hyperliquid/userFees';

export function useUserFees(
  payload: PerpUserFeesPayload,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [USER_FEES_QUERY_KEY, payload],
    queryFn: () => perpUserFees(payload),
    retry: 0,
    enabled: Boolean(enabled && payload.address),
    staleTime: 60_000,
  });
}
