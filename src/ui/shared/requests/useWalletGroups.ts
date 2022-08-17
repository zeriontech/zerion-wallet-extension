import { useQuery } from 'react-query';
import { walletPort } from '../channels';

export function useWalletGroups(options: { enabled?: boolean } = {}) {
  return useQuery(
    'wallet/uiGetWalletGroups',
    () => walletPort.request('uiGetWalletGroups'),
    { useErrorBoundary: true, enabled: options.enabled }
  );
}
