import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';

async function getRecoveryPhrase(groupId: string | null) {
  if (groupId) {
    const mnemonic = await walletPort.request('getRecoveryPhrase', { groupId });
    return mnemonic.phrase;
  } else {
    return walletPort.request('getPendingRecoveryPhrase');
  }
}

export function useRecoveryPhrase(groupId: string | null) {
  return useQuery({
    queryKey: ['getRecoveryPhrase', groupId],
    queryFn: () => getRecoveryPhrase(groupId),
    suspense: false,
    retry: 0,
    cacheTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    useErrorBoundary: false,
  });
}
