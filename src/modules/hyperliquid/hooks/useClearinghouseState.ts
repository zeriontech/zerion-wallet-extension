import { useQuery } from '@tanstack/react-query';
import { perpClearinghouseState } from '../api/requests/perp-clearinghouse-state.client';
import type { PerpClearinghouseStatePayload } from '../api/requests/perp-clearinghouse-state.types';
import type { DexIdentifier } from '../api/requests/perp-dexs.types';

export const CLEARINGHOUSE_STATE_QUERY_KEY = 'hyperliquid/clearinghouseState';

export function clearinghouseStateQueryOptions(payload: {
  address: string | null | undefined;
  dexIdentifier?: DexIdentifier;
}) {
  const { address, dexIdentifier } = payload;
  return {
    queryKey: [CLEARINGHOUSE_STATE_QUERY_KEY, address, dexIdentifier] as const,
    queryFn: () =>
      perpClearinghouseState({
        address: address as string,
        dexIdentifier,
      }),
    staleTime: 20_000,
    keepPreviousData: true,
    retry: 0,
    suspense: false,
  };
}

export function useClearinghouseState(
  payload: PerpClearinghouseStatePayload,
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
    queryKey: [CLEARINGHOUSE_STATE_QUERY_KEY, payload],
    queryFn: () => perpClearinghouseState(payload),
    retry: 0,
    suspense,
    enabled: Boolean(enabled && payload.address),
    staleTime: 20_000,
    refetchInterval,
  });
}
