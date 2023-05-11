import produce from 'immer';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { useOptimisticMutation } from 'src/ui/shared/requests/useOptimisticMutation';

export function useWalletNameFlags() {
  const { data: tabOrigin, isLoading } = useQuery(
    'activeTab/origin',
    getActiveTabOrigin
  );
  const { globalPreferences, mutation, query } = useGlobalPreferences();

  const setWalletNameFlags = useOptimisticMutation(
    async ({ flag, checked }: { flag: WalletNameFlag; checked: boolean }) => {
      const updatedPreferences = produce(globalPreferences, (draft) => {
        if (!draft || !tabOrigin) {
          return;
        }
        if (draft.walletNameFlags[tabOrigin]) {
          if (checked && !draft.walletNameFlags[tabOrigin].includes(flag)) {
            draft.walletNameFlags[tabOrigin].push(flag);
          } else if (!checked) {
            draft.walletNameFlags[tabOrigin] = draft.walletNameFlags[
              tabOrigin
            ].filter((item) => item !== flag);
          }
        } else if (checked) {
          draft.walletNameFlags = { [tabOrigin]: [flag] };
        }
      });
      if (updatedPreferences) {
        mutation.mutateAsync(updatedPreferences);
      }
    },
    { relatedQueryKey: 'wallet/getGlobalPreferences' }
  );

  const isMetaMask = useMemo(() => {
    if (!tabOrigin) {
      return false;
    }
    return globalPreferences?.walletNameFlags[tabOrigin]?.includes(
      WalletNameFlag.isMetaMask
    );
  }, [globalPreferences, tabOrigin]);

  return {
    walletNameFlags: tabOrigin
      ? globalPreferences?.walletNameFlags[tabOrigin] || []
      : undefined,
    isLoading: isLoading || query.isLoading,
    setWalletNameFlags,
    isMetaMask,
  };
}
