import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { Params } from '../requests/deposit-get-quotes';

export function useDepositQuotes(
  params: Params,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['depositGetQuotes', params],
    queryFn: () => ZerionAPI.depositGetQuotes(params),
    enabled,
    // Quotes are priced, so they go stale quickly
    staleTime: 20000,
    // Typing in the amount field re-keys the query on every keystroke; without
    // this the whole "Receive" side flickers empty between quotes
    keepPreviousData: true,
    suspense: false,
  });
}
