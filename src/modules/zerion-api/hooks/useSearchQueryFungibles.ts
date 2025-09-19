import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { Response } from 'src/modules/zerion-api/requests/search-query-fungibles';

export function useSearchQueryFungibles({
  query,
  currency,
  chain,
  limit = 5,
}: {
  query: string;
  currency: string;
  chain?: string;
  limit?: number;
}) {
  return useQuery<Response | null>({
    queryKey: ['searchQueryFungibles', query, currency, chain, limit],
    queryFn: () => {
      return ZerionAPI.searchQueryFungibles({
        query,
        currency,
        chain,
        limit,
      });
    },
    enabled: query.trim().length > 0,
    staleTime: 30000,
    suspense: false,
  });
}
