import { useSuspenseQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

export function usePrivateKey(address: string) {
  return useSuspenseQuery({
    queryKey: ['getPrivateKey', address],
    queryFn: () => walletPort.request('getPrivateKey', { address }),
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
