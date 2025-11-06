import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import type { Response } from 'src/modules/zerion-api/requests/search-query-fungibles';
import { isTruthy } from 'is-truthy-ts';
import type { Params } from '../requests/search-query-fungibles';

export function useSearchQueryFungibles({
  query,
  currency,
  chain,
  sort,
  limit = 5,
}: Params) {
  const queryData = useInfiniteQuery<Response | null>({
    queryKey: ['searchQueryFungibles', query, currency, chain, limit, sort],
    queryFn: ({ pageParam }) => {
      return ZerionAPI.searchQueryFungibles({
        query,
        currency,
        chain,
        limit,
        sort,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.pagination.cursor || undefined,
    staleTime: 30000,
    suspense: false,
    refetchOnWindowFocus: false,
  });

  const fungibles = useMemo(() => {
    return queryData.data?.pages.flatMap((page) => page?.data).filter(isTruthy);
  }, [queryData.data]);

  return { fungibles, queryData };
}
