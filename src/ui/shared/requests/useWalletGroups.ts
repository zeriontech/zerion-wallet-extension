import { useQuery } from '@tanstack/react-query';
import { walletPort } from '../channels';
import { checkForTestAddress } from '../meta-app-state';

export function useWalletGroups(options: { enabled?: boolean } = {}) {
  return useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    {
      useErrorBoundary: true,
      enabled: options.enabled,
      onSuccess(groups) {
        requestIdleCallback(() => {
          checkForTestAddress(groups);
        });
      },
    }
  );
}
