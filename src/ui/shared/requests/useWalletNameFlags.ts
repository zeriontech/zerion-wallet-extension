import produce from 'immer';
import { useMemo } from 'react';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import { useOptimisticMutation } from 'src/ui/shared/requests/useOptimisticMutation';
import { pushUnique } from '../pushUnique';
import { removeFromArray } from '../removeFromArray';

export function useWalletNameFlags(tabOrigin?: string) {
  const { globalPreferences, query, setGlobalPreferences } =
    useGlobalPreferences();

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
            // we don't want to delete key here to save information that flag was removed
            removeFromArray(draft.walletNameFlags[tabOrigin], flag);
          }
        } else if (checked) {
          draft.walletNameFlags = { [tabOrigin]: [flag] };
        }
      });
      if (updatedPreferences) {
        setGlobalPreferences(updatedPreferences);
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
