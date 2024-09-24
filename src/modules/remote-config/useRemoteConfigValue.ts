import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import type { RemoteConfig } from './types';

export function useRemoteConfigValue<K extends keyof RemoteConfig>(key: K) {
  return useQuery({
    queryKey: ['wallet/getRemoteConfigValue', key],
    queryFn: async () => {
      const value = await walletPort.request('getRemoteConfigValue', { key });
      return value as RemoteConfig[K];
    },
    useErrorBoundary: false,
    cacheTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
