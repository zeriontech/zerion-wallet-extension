import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invariant } from 'src/shared/invariant';
import { maybeTriggerMnemonicRestoration } from 'src/ui/components/MnemonicPhraseRestoration';
import { walletPort } from 'src/ui/shared/channels';

export function usePendingRecoveryPhrase({ enabled }: { enabled: boolean }) {
  const query = useQuery({
    queryKey: ['getPendingRecoveryPhrase'],
    queryFn: () => walletPort.request('getPendingRecoveryPhrase'),
    enabled,
    suspense: false,
    retry: 0,
    cacheTime: 0 /** sensitive value, prevent from being cached */,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    useErrorBoundary: false,
  });
  useEffect(() => {
    if (query.error) {
      maybeTriggerMnemonicRestoration(query.error);
    }
  }, [query.error]);
  return query;
}

export function useRecoveryPhrase({
  groupId,
  enabled,
}: {
  groupId: string | null;
  enabled: boolean;
}) {
  const query = useQuery({
    queryKey: ['getRecoveryPhrase', groupId],
    queryFn: async () => {
      invariant(groupId, 'groupId is not set');
      const mnemonic = await walletPort.request('getRecoveryPhrase', {
        groupId,
      });
      return mnemonic.phrase;
    },
    enabled,
    suspense: false,
    retry: 0,
    cacheTime: 0 /** sensitive value, prevent from being cached */,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    useErrorBoundary: false,
  });
  useEffect(() => {
    if (query.error) {
      maybeTriggerMnemonicRestoration(query.error);
    }
  }, [query.error]);
  return query;
}
