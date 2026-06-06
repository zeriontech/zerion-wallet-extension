import React, { useCallback } from 'react';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { SwapButtonOnboardingDialog } from './SwapButtonOnboardingDialog';

export function useSwapButtonOnboardingGate({
  fire,
  simulated,
}: {
  fire: () => void;
  simulated: boolean;
}): { guardedFire: () => void; dialog: React.ReactNode } {
  const { open, openDialog, closeDialog } = useDialog2();
  const { preferences, setPreferences } = usePreferences();

  // The gate intercepts only the first pre-simulation tap. Once `simulated`
  // is true the user is on the "Confirm Swap" step and has necessarily
  // passed through `fire` once already this session.
  const shouldGate =
    !simulated && preferences?.oneTapCrossChainSwapOnboardingShown !== true;

  const guardedFire = useCallback(() => {
    if (shouldGate) {
      openDialog();
    } else {
      fire();
    }
  }, [shouldGate, openDialog, fire]);

  const handleConfirm = useCallback(() => {
    setPreferences({ oneTapCrossChainSwapOnboardingShown: true });
    closeDialog();
    fire();
  }, [setPreferences, closeDialog, fire]);

  const dialog = (
    <SwapButtonOnboardingDialog
      open={open}
      onClose={closeDialog}
      onConfirm={handleConfirm}
    />
  );

  return { guardedFire, dialog };
}
