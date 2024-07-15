import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import type { BackupContext } from './useBackupContext';

async function getRecoveryPhrase(context: BackupContext) {
  if (context.appMode === 'wallet') {
    const mnemonic = await walletPort.request('getRecoveryPhrase', {
      groupId: context.groupId,
    });
    return mnemonic.phrase;
  } else {
    return walletPort.request('getPendingRecoveryPhrase');
  }
}

export function useRecoveryPhrase(context: BackupContext) {
  return useQuery({
    queryKey: ['getRecoveryPhrase', context],
    queryFn: () => getRecoveryPhrase(context),
    suspense: false,
    retry: 0,
    cacheTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
    useErrorBoundary: false,
  });
}
