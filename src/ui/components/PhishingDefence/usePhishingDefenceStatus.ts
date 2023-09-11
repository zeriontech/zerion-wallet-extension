import { useQuery } from '@tanstack/react-query';
import { phishingDefencePort } from 'src/ui/shared/channels';

export function usePhishingDefenceStatus(origin?: string) {
  return useQuery({
    queryKey: ['phishingDefence', 'getDappSecurityStatus', origin],
    queryFn: () =>
      phishingDefencePort.request('getDappSecurityStatus', {
        url: origin,
      }),
    cacheTime: 0,
    suspense: false,
    refetchInterval: (data) =>
      data?.status === 'loading' || data?.status === 'unknown' ? 64 : false,
  });
}
