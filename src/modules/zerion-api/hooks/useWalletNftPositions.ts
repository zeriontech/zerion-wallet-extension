import { useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { ZerionAPI } from '../zerion-api.client';
import type { NftPosition, Params, Response } from '../requests/wallet-get-nft-positions';
import type { BackendSourceParams } from '../shared';

const QUERY_KEY = 'walletGetNftPositions';
const STALE_TIME = 20000;

export function useWalletNftPositions(
  params: Params,
  { source }: BackendSourceParams,
  {
    enabled = true,
    refetchInterval,
  }: {
    enabled?: boolean;
    refetchInterval?: number | false;
  } = {},
) {
  const queryData = useInfiniteQuery<
    Response,
    Error,
    InfiniteData<Response>,
    QueryKey,
    string | undefined
  >({
    queryKey: persistentQuery([QUERY_KEY, params, source]),
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      ZerionAPI.walletGetNftPositions(
        { ...params, cursor: pageParam as string | undefined },
        { source },
      ),
    getNextPageParam: (lastPage) => lastPage?.meta?.pagination.cursor || undefined,
    enabled,
    staleTime: STALE_TIME,
    refetchInterval,
  });

  const positions = useMemo<NftPosition[]>(() => {
    return queryData.data?.pages.flatMap((page) => page.data) ?? [];
  }, [queryData.data]);

  return {
    data: positions,
    isLoading: queryData.isLoading,
    isError: queryData.isError,
    refetch: queryData.refetch,
    fetchNextPage: queryData.fetchNextPage,
    hasNextPage: queryData.hasNextPage,
    isFetchingNextPage: queryData.isFetchingNextPage,
  };
}
