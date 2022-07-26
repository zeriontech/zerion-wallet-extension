import { useQuery } from 'react-query';
import { walletPort } from '../channels';

export function useMnemonicQuery() {
  return useQuery(
    'wallet/getRecoveryPhrase',
    () => {
      return walletPort.request('getRecoveryPhrase');
    },
    { useErrorBoundary: true }
  );
}
