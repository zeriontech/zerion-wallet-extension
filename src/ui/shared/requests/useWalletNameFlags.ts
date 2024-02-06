import { produce } from 'immer';
import { useMutation } from '@tanstack/react-query';
import { pushUnique, removeFromArray } from 'src/shared/array-mutations';
import type { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';
import {
  getWalletNameFlagsByOrigin,
  isMetamaskModeOn,
} from 'src/shared/preferences-helpers';

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
        const value = draft.walletNameFlags[tabOrigin];
        if (checked) {
          if (value) {
            pushUnique(value, flag);
          } else {
            draft.walletNameFlags[tabOrigin] = [flag];
          }
        } else {
          if (value) {
            removeFromArray(value, flag);
          } else {
            draft.walletNameFlags[tabOrigin] = [];
          }
        }
      });
      if (updatedPreferences) {
        return mutation.mutateAsync(updatedPreferences);
      }
    },
  });

  const walletNameFlags =
    globalPreferences && tabOrigin
      ? getWalletNameFlagsByOrigin(globalPreferences, tabOrigin)
      : null;

  const isMetaMask = walletNameFlags
    ? isMetamaskModeOn(walletNameFlags)
    : false;

  return {
    walletNameFlags,
    isLoading: query.isLoading,
    setWalletNameFlags,
    isMetaMask,
  };
}
