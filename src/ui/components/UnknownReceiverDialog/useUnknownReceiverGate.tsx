import React, { useCallback, useState } from 'react';
import type { NetworkInfo } from 'src/modules/networks/NetworkInfo';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { SimulationResult } from 'src/ui/pages/SwapForm2/SwapButton';
import type { WarningContent } from 'src/ui/pages/SwapForm2/TransactionWarning';
import { useDialog2 } from 'src/ui/ui-kit/ModalDialogs/Dialog2';
import { UnknownReceiverDialog } from './UnknownReceiverDialog';
import { useReceiverFamiliarity } from './useReceiverFamiliarity';

/**
 * Interposes the **Unknown receiver** confirmation in front of a sign call.
 *
 * Unlike `useReadonlyReceiverGate`, this gate wraps the *sign call* rather
 * than the button tap, for two reasons: the dialog shows the interpreted
 * Address Action, which only exists after the Simulation; and every sign path
 * has to be covered, including the second tap / hold-to-sign that follows a
 * simulation warning. The warning is reflected inside the dialog — the user
 * has already held the button by then, so we never ask for a second hold.
 *
 * See ADR-0005.
 */
export function useUnknownReceiverGate({
  senderAddress,
  to,
  network,
  warning,
  sign,
  onIntercept,
}: {
  senderAddress: string;
  to: string | null | undefined;
  network: NetworkInfo | null;
  warning: WarningContent | null;
  sign: (result: SimulationResult) => void;
  /**
   * Called when the gate interposes instead of signing. The caller uses it to
   * record that the form has reached its confirm step, so dismissing the
   * dialog leaves the user one tap away from signing rather than sending them
   * back through another Simulation round-trip.
   */
  onIntercept?: () => void;
}): {
  guardedSign: (result: SimulationResult) => void;
  dialog: React.ReactNode;
} {
  const { open, openDialog, closeDialog } = useDialog2();
  const familiarity = useReceiverFamiliarity(to);
  const [pendingResult, setPendingResult] = useState<SimulationResult>(null);

  const guardedSign = useCallback(
    (result: SimulationResult) => {
      // Without a receiver there is nothing to confirm; the sign mutation's
      // own invariants cover that case.
      if (!to || familiarity === 'known') {
        sign(result);
        return;
      }
      setPendingResult(result);
      openDialog();
      onIntercept?.();
    },
    [to, familiarity, sign, openDialog, onIntercept]
  );

  const handleConfirm = useCallback(() => {
    closeDialog();
    sign(pendingResult);
  }, [closeDialog, sign, pendingResult]);

  const dialog = (
    <UnknownReceiverDialog
      open={open}
      onClose={closeDialog}
      senderAddress={senderAddress}
      receiverAddress={to ? normalizeAddress(to) : ''}
      network={network}
      addressAction={pendingResult?.data?.action ?? null}
      warning={warning}
      onConfirm={handleConfirm}
    />
  );

  return { guardedSign, dialog };
}
