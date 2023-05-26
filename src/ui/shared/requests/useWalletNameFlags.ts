import produce from 'immer';
import { useMemo } from 'react';
import { pushUnique, removeFromArray } from 'src/shared/array-mutations';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { useOptimisticMutation } from 'src/ui/shared/requests/useOptimisticMutation';

export function useWalletNameFlags(tabOrigin?: string) {
  const { globalPreferences, query, mutation } = useGlobalPreferences();

  const setWalletNameFlags = useOptimisticMutation(
    async ({ flag, checked }: { flag: WalletNameFlag; checked: boolean }) => {
      const updatedPreferences = produce(globalPreferences, (draft) => {
        if (!draft || !tabOrigin) {
          return;
        }
        if (draft.walletNameFlags[tabOrigin]) {
          if (checked) {
            pushUnique(draft.walletNameFlags[tabOrigin], flag);
          } else {
            removeFromArray(draft.walletNameFlags[tabOrigin], flag);
          }
        } else if (checked) {
          draft.walletNameFlags = { [tabOrigin]: [flag] };
        }
      });
      if (updatedPreferences) {
        return mutation.mutateAsync(updatedPreferences);
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
    isLoading: query.isLoading,
    setWalletNameFlags,
    isMetaMask,
  };
}
