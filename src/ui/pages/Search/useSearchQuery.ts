import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { Response } from 'src/modules/zerion-api/requests/search-query';

export function useSearchQuery(query: string, currency: string) {
  return useQuery<Response | null>({
    queryKey: ['searchQuery', query, currency],
    queryFn: () => {
      return ZerionAPI.searchQuery({
        query,
        currency,
        limit: 5,
      });
    },
    enabled: query.trim().length > 0,
    staleTime: 30000,
    suspense: false,
  });
}
