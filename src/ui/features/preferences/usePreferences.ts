import { useQuery } from '@tanstack/react-query';
import type { WalletRecord } from 'src/shared/types/WalletRecord';
import { walletPort } from 'src/ui/shared/channels';
import { useOptimisticMutation } from 'src/ui/shared/requests/useOptimisticMutation';
import type { GlobalPreferences } from 'src/shared/types/GlobalPreferences';

type Preferences = WalletRecord['publicPreferences'];

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
  return {
    query,
    preferences: query.data,
    mutation,
    setPreferences: mutation.mutate,
  };
}

async function setGlobalPreferences(preferences: GlobalPreferences) {
  walletPort.request('setGlobalPreferences', { preferences });
}

export function useGlobalPreferences() {
  const query = useQuery(
    'wallet/getGlobalPreferences',
    () => walletPort.request('getGlobalPreferences'),
    { useErrorBoundary: true, suspense: true }
  );

  const mutation = useOptimisticMutation(setGlobalPreferences, {
    relatedQueryKey: 'wallet/getGlobalPreferences',
    onMutate: ({ client, variables }) =>
      client.setQueryData<GlobalPreferences>(
        'wallet/getGlobalPreferences',
        (globalPreferences) => ({ ...globalPreferences, ...variables })
      ),
  });
  return {
    query,
    globalPreferences: query.data,
    mutation,
    setGlobalPreferences: mutation.mutate,
  };
}
