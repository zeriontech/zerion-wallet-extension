import { useQuery } from 'react-query';
import { walletPort } from '../channels';

export function useMnemonicQuery({ groupId }: { groupId: string }) {
  return useQuery(
    'wallet/getRecoveryPhrase',
    () => {
      return walletPort.request('getRecoveryPhrase', { groupId });
    },
    { useErrorBoundary: true }
  );
}
