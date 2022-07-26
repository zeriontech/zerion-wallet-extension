import { useQuery } from 'react-query';
import { walletPort } from '../channels';

export function useLastBackedUp() {
  return useQuery(
    'wallet/getLastBackedUp',
    () => {
      return walletPort.request('getLastBackedUp');
    },
    { useErrorBoundary: true }
  );
}
