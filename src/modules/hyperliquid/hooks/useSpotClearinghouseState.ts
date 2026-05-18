import { useQuery } from '@tanstack/react-query';
import { spotClearinghouseState } from '../api/requests/spot-clearinghouse-state.client';

export const SPOT_CLEARINGHOUSE_STATE_QUERY_KEY =
  'hyperliquid/spotClearinghouseState';

export function spotClearinghouseStateQueryOptions(payload: {
  address: string | null | undefined;
}) {
  const { address } = payload;
  return {
    queryKey: [SPOT_CLEARINGHOUSE_STATE_QUERY_KEY, address] as const,
    queryFn: () => spotClearinghouseState({ address: address as string }),
    staleTime: 10_000,
    keepPreviousData: true,
    retry: 1,
    suspense: false,
  };
}

export function useSpotClearinghouseState(
  payload: { address: string | null | undefined },
  {
    enabled = true,
    refetchInterval,
  }: { enabled?: boolean; refetchInterval?: number | false } = {}
) {
  return useQuery({
    queryKey: [SPOT_CLEARINGHOUSE_STATE_QUERY_KEY, payload.address],
    queryFn: () =>
      spotClearinghouseState({ address: payload.address as string }),
    enabled: enabled && Boolean(payload.address),
    staleTime: 10_000,
    keepPreviousData: true,
    retry: 1,
    refetchInterval,
    suspense: false,
  });
}
