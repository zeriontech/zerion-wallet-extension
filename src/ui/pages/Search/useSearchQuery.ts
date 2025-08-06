import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { Response } from 'src/modules/zerion-api/requests/search-query';

export function useSearchQuery({
  query,
  currency,
  limit = 5,
}: {
  query: string;
  currency: string;
  limit?: number;
}) {
  return useQuery<Response | null>({
    queryKey: ['searchQuery', query, currency, limit],
    queryFn: () => {
      return ZerionAPI.searchQuery({
        query,
        currency,
        limit,
      });
    },
    enabled: query.trim().length > 0,
    staleTime: 30000,
    suspense: false,
  });
}
