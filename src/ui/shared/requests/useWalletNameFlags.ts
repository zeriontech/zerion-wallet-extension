import produce from 'immer';
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { pushUnique, removeFromArray } from 'src/shared/array-mutations';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';

export function useWalletNameFlags(tabOrigin?: string) {
  const { globalPreferences, query, mutation } = useGlobalPreferences();

  const setWalletNameFlags = useMutation({
    mutationFn: async ({
      flag,
      checked,
    }: {
      flag: WalletNameFlag;
      checked: boolean;
    }) => {
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
  });

  const isMetaMask = useMemo(() => {
    if (!tabOrigin) {
      return false;
    }
    return Boolean(
      globalPreferences?.walletNameFlags[tabOrigin]?.includes(
        WalletNameFlag.isMetaMask
      )
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
