import { useQuery } from '@tanstack/react-query';
import { userAbstraction } from '../api/requests/user-abstraction.client';

export const USER_ABSTRACTION_QUERY_KEY = 'hyperliquid/userAbstraction';

// Account mode is user-initiated and changes very rarely. Cache for the
// session and rely on manual invalidation (post-deposit / post-withdraw)
// rather than polling.
const ABSTRACTION_STALE_TIME = Number.POSITIVE_INFINITY;

export function userAbstractionQueryOptions(payload: {
  address: string | null | undefined;
}) {
  const { address } = payload;
  return {
    queryKey: [USER_ABSTRACTION_QUERY_KEY, address] as const,
    queryFn: () => userAbstraction({ address: address as string }),
    staleTime: ABSTRACTION_STALE_TIME,
    keepPreviousData: true,
    retry: 1,
    suspense: false,
  };
}

export function useUserAbstraction(
  payload: { address: string | null | undefined },
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [USER_ABSTRACTION_QUERY_KEY, payload.address],
    queryFn: () => userAbstraction({ address: payload.address as string }),
    enabled: enabled && Boolean(payload.address),
    staleTime: ABSTRACTION_STALE_TIME,
    keepPreviousData: true,
    retry: 1,
    suspense: false,
  });
}
