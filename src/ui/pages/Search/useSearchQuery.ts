import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { Response } from 'src/modules/zerion-api/requests/search-query';

export function useSearchQuery(query: string, currency: string) {
  return useQuery<Response | null>({
    queryKey: ['searchQuery', query, currency],
    queryFn: () => {
      if (!query.trim()) return null;
      return ZerionAPI.searchQuery({
        query: query.trim(),
        currency,
        limit: 5,
      });
    },
    enabled: query.trim().length > 0,
    staleTime: 30000,
    suspense: false,
  });
}
