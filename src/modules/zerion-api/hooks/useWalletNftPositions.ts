import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { ZerionAPI } from '../zerion-api.client';
import type { NftPosition, Params } from '../requests/wallet-get-nft-positions';
import type { BackendSourceParams } from '../shared';

const QUERY_KEY = 'walletGetNftPositions';
const STALE_TIME = 20000;

export function useWalletNftPositions(
  params: Params,
  { source }: BackendSourceParams,
  {
    enabled = true,
    refetchInterval,
    suspense,
  }: {
    enabled?: boolean;
    refetchInterval?: number | false;
    suspense?: boolean;
  } = {}
) {
  const queryData = useInfiniteQuery({
    queryKey: persistentQuery([QUERY_KEY, params, source]),
    queryFn: ({ pageParam }) =>
      ZerionAPI.walletGetNftPositions(
        { ...params, cursor: pageParam as string | undefined },
        { source }
      ),
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.pagination.cursor || undefined,
    enabled,
    staleTime: STALE_TIME,
    refetchInterval,
    suspense,
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
