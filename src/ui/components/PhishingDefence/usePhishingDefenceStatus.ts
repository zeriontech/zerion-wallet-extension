import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

export function usePhishingDefenceStatus(origin?: string | null) {
  return useQuery({
    queryKey: ['wallet/getDappSecurityStatus', origin],
    queryFn: () =>
      walletPort.request('getDappSecurityStatus', {
        url: origin,
      }),
    cacheTime: 0,
    suspense: false,
    refetchInterval: (data) =>
      data?.status === 'loading' || data?.status === 'unknown' ? 100 : false,
  });
}
