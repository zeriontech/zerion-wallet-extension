import { useQuery } from '@tanstack/react-query';
// import type { DappSecurityStatus } from 'src/modules/phishing-defence/phishing-defence-service';
import { walletPort } from 'src/ui/shared/channels';

// let counter = 0;

export function usePhishingDefenceStatus(origin?: string | null) {
  return useQuery({
    queryKey: ['wallet/getDappSecurityStatus', origin],
    queryFn: () => {
      // if (counter > 30) {
      //   return Promise.resolve({
      //     status: 'ok',
      //   } as { status: DappSecurityStatus; isWhitelisted: boolean });
      // } else {
      //   counter++;
      //   return Promise.resolve({
      //     status: 'loading',
      //   } as { status: DappSecurityStatus; isWhitelisted: boolean });
      // }
      return walletPort.request('getDappSecurityStatus', {
        url: origin,
      });
    },
    cacheTime: 0,
    suspense: false,
    refetchInterval: (data) =>
      data?.status === 'loading' || data?.status === 'unknown' ? 100 : false,
  });
}
