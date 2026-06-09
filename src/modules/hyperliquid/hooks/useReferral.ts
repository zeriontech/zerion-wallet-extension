import { useQuery } from '@tanstack/react-query';
import { perpReferral } from '../api/requests/perp-referral.client';
import type { PerpReferralPayload } from '../api/requests/perp-referral.types';

export const REFERRAL_QUERY_KEY = 'hyperliquid/referral';

export function useReferral(
  payload: PerpReferralPayload,
  {
    suspense = false,
    enabled = true,
  }: { suspense?: boolean; enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [REFERRAL_QUERY_KEY, payload],
    queryFn: () => perpReferral(payload),
    retry: 0,
    suspense,
    enabled: Boolean(enabled && payload.address),
    staleTime: 60_000,
  });
}
