import { useCallback, useMemo } from 'react';
import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { useConfidentialPermits } from 'src/ui/features/confidential-balances/useConfidentialPermits';
import { withPermits } from 'src/ui/features/confidential-balances/withPermits';
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
  const { permits, fingerprint, isReady } = useConfidentialPermits(
    params.addresses
  );
  const queryKey = useMemo(
    () => ['walletGetActions', params, source, fingerprint],
    [params, source, fingerprint]
  );
  const queryData = useInfiniteQuery({
    // the permits fingerprint stands in for `permits` in the key: signatures themselves never go into a (persisted) query key
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    queryFn: ({ pageParam }) =>
      withPermits(permits, (permits) =>
        ZerionAPI.walletGetActions(
          {
            ...params,
            permits,
            chain: params.chain || undefined,
            cursor: pageParam ?? params.cursor,
          },
          { source }
        )
      ),
    enabled: enabled && isReady,
    suspense,
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.pagination.cursor || undefined,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval,
  });

  const actions = useMemo(() => {
    return queryData.data?.pages.flatMap((page) => page.data);
  }, [queryData.data]);

  // Slice data to the first page on refetch
  // Based on: https://github.com/TanStack/query/discussions/1670#discussioncomment-13006968
  const refetch = useCallback(() => {
    queryClient.setQueryData<InfiniteData<Response>>(queryKey, (data) => ({
      pages: data?.pages.slice(0, 1) || [],
      pageParams: data?.pageParams.slice(0, 1) || [],
    }));
    queryClient.refetchQueries(queryKey);
  }, [queryKey]);

  return { actions, refetch, queryData };
}
