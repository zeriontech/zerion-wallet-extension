import { useQuery } from '@tanstack/react-query';
import { perpCandleSnapshot } from '../api/requests/perp-candle-snapshot.client';
import type { PerpCandleSnapshotPayload } from '../api/requests/perp-candle-snapshot.types';

export const CANDLE_SNAPSHOT_QUERY_KEY = 'hyperliquid/candleSnapshot';

export function useCandleSnapshot(
  payload: PerpCandleSnapshotPayload,
  {
    enabled = true,
    refetchInterval,
  }: {
    enabled?: boolean;
    refetchInterval?: number | false;
  } = {},
) {
  return useQuery({
    queryKey: [CANDLE_SNAPSHOT_QUERY_KEY, payload],
    queryFn: () => perpCandleSnapshot(payload),
    retry: 0,
    enabled,
    staleTime: 10_000,
    refetchInterval,
  });
}
