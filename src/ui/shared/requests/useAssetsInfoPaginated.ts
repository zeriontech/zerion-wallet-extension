import { useInfiniteQuery } from '@tanstack/react-query';
import type { AssetInfo } from 'defi-sdk';
import { client } from 'defi-sdk';
import { getError } from 'src/shared/errors/getError';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

export function useAssetsInfoPaginatedQuery(
  params: Omit<Parameters<typeof client.assetsInfo>[0], 'limit' | 'offset'>,
  { suspense, enabled }: { suspense: boolean; enabled: boolean }
) {
  const LIMIT = 30;
  const query = useInfiniteQuery({
    suspense,
    queryKey: ['assetsInfoPaginated', LIMIT, params],
    queryFn: async ({
      pageParam: { limit, offset } = { limit: LIMIT, offset: 0 },
    }) => {
      return Promise.race([
        new Promise<AssetInfo[]>((resolve, reject) => {
          client.assetsInfo(
            { limit, offset, ...params },
            {
              method: 'get',
              onError: (error) => {
                reject(getError(error));
              },
              onData: (data) => {
                resolve(data.info);
              },
            }
          );
        }),
        rejectAfterDelay(10000, 'assetsInfoPaginated'),
      ]);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < LIMIT) {
        return undefined; // sets hasNextPage to `false`
      }
      const offset = allPages.reduce((sum, items) => sum + items.length, 0);
      return { limit: LIMIT, offset };
    },
    enabled,
  });
  return {
    items: query.data?.pages.flat(),
    ...query,
  };
}
