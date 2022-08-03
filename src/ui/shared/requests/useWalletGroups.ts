import { useQuery } from 'react-query';
import { walletPort } from '../channels';

export function useWalletGroups() {
  return useQuery(
    'wallet/getWalletGroups',
    () => walletPort.request('getWalletGroups'),
    { useErrorBoundary: true }
  );
}
