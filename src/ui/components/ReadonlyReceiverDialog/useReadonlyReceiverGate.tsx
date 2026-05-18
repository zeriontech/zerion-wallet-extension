import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { getWalletGroupByAddress } from 'src/ui/shared/requests/getWalletGroupByAddress';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { ReadonlyReceiverDialog } from './ReadonlyReceiverDialog';

export function useReadonlyReceiverGate({
  to,
  fire,
}: {
  to: string | null | undefined;
  fire: () => void;
}): { guardedFire: () => void; dialog: React.ReactNode } {
  const normalizedTo = to ? normalizeAddress(to) : null;
  const { open, openDialog, closeDialog } = useDialog2();
  const { preferences, setPreferences } = usePreferences();

  const { data: walletGroup } = useQuery({
    queryKey: ['getWalletGroupByAddress', normalizedTo],
    queryFn: () => getWalletGroupByAddress(normalizedTo as string),
    enabled: Boolean(normalizedTo),
    suspense: false,
  });

  const recipientWallet =
    walletGroup && normalizedTo
      ? walletGroup.walletContainer.wallets.find(
          (wallet) => normalizeAddress(wallet.address) === normalizedTo
        ) ?? null
      : null;

  const isExcluded = normalizedTo
    ? preferences?.addressesExcludedFromReceiverReadonlyWarning?.includes(
        normalizedTo
      ) ?? false
    : false;

  const shouldGate = Boolean(
    walletGroup &&
      isReadonlyContainer(walletGroup.walletContainer) &&
      !isExcluded
  );

  const guardedFire = useCallback(() => {
    if (shouldGate) {
      openDialog();
    } else {
      fire();
    }
  }, [shouldGate, openDialog, fire]);

  const handleProceed = useCallback(
    ({ dontShowAgain }: { dontShowAgain: boolean }) => {
      if (dontShowAgain && normalizedTo) {
        const current =
          preferences?.addressesExcludedFromReceiverReadonlyWarning ?? [];
        if (!current.includes(normalizedTo)) {
          setPreferences({
            addressesExcludedFromReceiverReadonlyWarning: [
              ...current,
              normalizedTo,
            ],
          });
        }
      }
      closeDialog();
      fire();
    },
    [normalizedTo, preferences, setPreferences, closeDialog, fire]
  );

  const dialog = (
    <ReadonlyReceiverDialog
      open={open}
      onClose={closeDialog}
      wallet={recipientWallet}
      onProceed={handleProceed}
    />
  );

  return { guardedFire, dialog };
}
