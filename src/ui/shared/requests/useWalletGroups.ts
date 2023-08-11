import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { checkForTestAddress } from '../meta-app-state';

export function useWalletGroups(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    enabled: options.enabled,
    onSuccess(groups) {
      requestIdleCallback(() => {
        checkForTestAddress(groups);
      });
    },
  });
}
