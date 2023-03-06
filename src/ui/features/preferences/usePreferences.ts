import { useQuery } from 'react-query';
import type { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import type { WalletRecord } from 'src/shared/types/WalletRecord';
import { walletPort } from 'src/ui/shared/channels';
import { useOptimisticMutation } from 'src/ui/shared/requests/useOptimisticMutation';

type Preferences = WalletRecord['publicPreferences'];

async function walletSetWalletNameFlag({
  flag,
  checked,
}: {
  flag: WalletNameFlag;
  checked: boolean;
}) {
  return walletPort.request('wallet_setWalletNameFlag', { flag, checked });
}
async function setPreferences(preferences: Preferences) {
  walletPort.request('setPreferences', { preferences });
}

export function usePreferences() {
  const query = useQuery(
    'wallet/getPreferences',
    () => walletPort.request('getPreferences'),
    { useErrorBoundary: true, suspense: true }
  );
  const mutation = useOptimisticMutation(setPreferences, {
    relatedQueryKey: 'wallet/getPreferences',
    onMutate: ({ client, variables }) => {
      client.setQueryData<Preferences>(
        'wallet/getPreferences',
        (preferences) => ({ ...preferences, ...variables })
      );
    },
  });
  const setWalletNameFlagMutation = useOptimisticMutation(
    walletSetWalletNameFlag,
    { relatedQueryKey: 'wallet/getPreferences' }
  );
  return {
    query,
    preferences: query.data,
    mutation,
    setPreferences: mutation.mutate,
    setWalletNameFlagMutation,
    setWalletNameFlag: setWalletNameFlagMutation.mutate,
  };
}
