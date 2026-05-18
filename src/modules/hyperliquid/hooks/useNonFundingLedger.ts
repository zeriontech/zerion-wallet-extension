import { useQuery } from '@tanstack/react-query';
import { perpNonFundingLedger } from '../api/requests/perp-non-funding-ledger.client';
import type { NonFundingLedgerPayload } from '../api/requests/perp-non-funding-ledger.types';

export const NON_FUNDING_LEDGER_QUERY_KEY = 'hyperliquid/nonFundingLedger';

export function useNonFundingLedger(
  payload: NonFundingLedgerPayload,
  {
    suspense = false,
    enabled = true,
  }: { suspense?: boolean; enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [NON_FUNDING_LEDGER_QUERY_KEY, payload],
    queryFn: () => perpNonFundingLedger(payload),
    retry: 0,
    suspense,
    enabled: Boolean(enabled && payload.address),
    staleTime: 20_000,
  });
}
