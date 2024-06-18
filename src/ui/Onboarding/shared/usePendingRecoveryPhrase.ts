import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

export function usePendingRecoveryPhrase() {
  return useQuery({
    queryKey: ['getPendingRecoveryPhrase'],
    queryFn: () => {
      return walletPort.request('getPendingRecoveryPhrase');
    },
    cacheTime: 0 /** sensitive value, prevent from being cached */,
    suspense: false,
    retry: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    useErrorBoundary: false,
  });
}
