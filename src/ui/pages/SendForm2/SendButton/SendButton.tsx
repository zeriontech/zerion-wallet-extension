import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { DangerSignButton, RegularSignButton } from 'src/ui/components/HoldToSignButton';
import type { SimulationResult } from 'src/ui/shared/requests/useSimulateTransactions';
import { useReadonlyReceiverGate } from 'src/ui/components/ReadonlyReceiverDialog';
import type { SendFormState2 } from '../types';
import type { SendSlotButton } from '../resolveSendSlot';
import { resolveSendButton } from './resolveSendButton';
import { useSendSimulation } from './useSendSimulation';

export function SendButton({
  address,
  formState,
  transaction,
  simulated,
  signing,
  isPreparingTransaction,
  slotButton,
  exceedsBalance,
  onSimulationCompleted,
  onSign,
  dangerTitle,
  onCancel,
}: {
  address: string;
  formState: SendFormState2;
  transaction: MultichainTransaction | null;
  simulated: boolean;
  signing: boolean;
  isPreparingTransaction: boolean;
  slotButton: SendSlotButton;
  exceedsBalance: boolean;
  onSimulationCompleted: (result: SimulationResult, transaction: MultichainTransaction) => void;
  onSign: () => void;
  dangerTitle?: string;
  onCancel: () => void;
}) {
  const { state, fire } = useSendSimulation({
    address,
    transaction,
    simulated,
    onSimulationCompleted,
    onSign,
  });

  const { guardedFire, dialog: readonlyReceiverDialog } = useReadonlyReceiverGate({
    to: formState.to,
    fire,
  });
  const effectiveFire = simulated ? fire : guardedFire;

  const { label, disabled } = resolveSendButton({
    formState,
    transaction,
    state,
    simulated,
    signing,
    isPreparingTransaction,
    slotButton,
    exceedsBalance,
  });

  const isDanger = Boolean(dangerTitle) && (state === 'simulating' || !disabled);

  return (
    <>
      {readonlyReceiverDialog}
      <AnimatePresence mode="popLayout" initial={false}>
        {isDanger ? (
          <motion.div
            key="danger"
            transition={{ duration: 0.2 }}
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
          >
            <DangerSignButton
              state={state}
              fire={effectiveFire}
              dangerTitle={dangerTitle as string}
              onCancel={onCancel}
            />
          </motion.div>
        ) : (
          <motion.div
            key="regular"
            transition={{ duration: 0.2 }}
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
          >
            <RegularSignButton
              state={state}
              fire={effectiveFire}
              label={label}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
