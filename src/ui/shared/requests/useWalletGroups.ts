import { useQuery } from 'react-query';
import { walletPort } from '../channels';

export function useWalletGroups(options: { enabled?: boolean } = {}) {
  return useQuery(
    'wallet/getWalletGroups',
    () => walletPort.request('getWalletGroups'),
    { useErrorBoundary: true, enabled: options.enabled }
  );
}
