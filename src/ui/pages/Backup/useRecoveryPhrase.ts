import { useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { walletPort } from 'src/ui/shared/channels';

export function useRecoveryPhrase({ groupId }: { groupId?: string }) {
  return useQuery({
    queryKey: ['getRecoveryPhrase', groupId],
    queryFn: async () => {
      if (groupId) {
        invariant(groupId, 'groupId param is required for wallet appMode');
        const mnemonic = await walletPort.request('getRecoveryPhrase', {
          groupId,
        });
        return mnemonic.phrase;
      } else {
        return walletPort.request('getPendingRecoveryPhrase');
      }
    },
    suspense: false,
    retry: 0,
    cacheTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    useErrorBoundary: false,
  });
}
