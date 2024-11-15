import { useQuery } from '@tanstack/react-query';
import type { RemoteConfig } from '../types';
import { fetchRemoteConfig } from './firebase';

export function useFirebaseConfig<T extends keyof RemoteConfig>(
  keys: T[],
  {
    suspense = false,
    enabled = true,
  }: { suspense?: boolean; enabled?: boolean } = {}
) {
  return useQuery({
    // it's okay to put the `keys` array inside queryKey array without memoizing:
    // it will be stringified anyway
    // https://github.com/TanStack/query/blob/b18426da86e2b8990e8f4e7398baaf041f77ad19/packages/query-core/src/utils.ts#L269-L280
    queryKey: ['fetchRemoteConfig', keys],
    queryFn: () => fetchRemoteConfig(keys),
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 20000,
    suspense,
    enabled,
  });
}
