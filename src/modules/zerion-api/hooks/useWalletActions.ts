import { useCallback, useMemo } from 'react';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { ZerionAPI } from '../zerion-api.client';
import type { Payload } from '../requests/wallet-get-actions';
import type { BackendSourceParams } from '../shared';

export function useWalletActions(
  params: Payload,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
    refetchInterval = false,
  }: {
    suspense?: boolean;
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number | false;
  } = {}
) {
  const queryData = useInfiniteQuery({
    queryKey: ['walletGetActions', params, source],
    queryFn: ({ pageParam }) =>
      ZerionAPI.walletGetActions(
        {
          ...params,
          chain: params.chain || undefined,
          cursor: pageParam ?? params.cursor,
        },
        { source }
      ),
    enabled,
    suspense,
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.pagination.cursor || undefined,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval,
  });

  const actions = useMemo(() => {
    return queryData.data?.pages.flatMap((page) => page.data);
  }, [queryData.data]);

  // Slice data to the first page on refetch
  // Based on: https://github.com/TanStack/query/discussions/1670#discussioncomment-13006968
  const refetch = useCallback(() => {
    queryClient.setQueryData<InfiniteData<Response>>(
      ['walletGetActions', params, source],
      (data) => ({
        pages: data?.pages.slice(0, 1) || [],
        pageParams: data?.pageParams.slice(0, 1) || [],
      })
    );
    queryClient.refetchQueries(['walletGetActions', params, source]);
  }, [params, source]);

  return { actions, refetch, queryData };
}
