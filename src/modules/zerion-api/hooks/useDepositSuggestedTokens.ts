import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { Params } from '../requests/deposit-get-suggested-tokens';

export function useDepositSuggestedTokens(
  params: Params,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['depositGetSuggestedTokens', params],
    queryFn: () => ZerionAPI.depositGetSuggestedTokens(params),
    enabled,
    // The featured/popular lists are editorial and move at most daily
    staleTime: 5 * 60 * 1000,
    // Searching should not blank the list that is already on screen
    keepPreviousData: true,
    suspense: false,
  });
}
