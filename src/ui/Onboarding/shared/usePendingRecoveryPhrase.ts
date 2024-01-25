import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

export function usePendingRecoveryPhrase() {
  return useQuery({
    queryKey: ['getPendingRecoveryPhrase'],
    queryFn: () => {
      return walletPort.request('getPendingRecoveryPhrase');
    },
    suspense: false,
    retry: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    useErrorBoundary: false,
  });
}
