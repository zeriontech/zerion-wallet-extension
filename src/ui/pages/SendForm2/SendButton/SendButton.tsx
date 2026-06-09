import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import {
  RegularSignButton,
  DangerSignButton,
  type SimulationResult,
} from 'src/ui/pages/SwapForm2/SwapButton';
import { useReadonlyReceiverGate } from 'src/ui/components/ReadonlyReceiverDialog';
import type { SendFormState2 } from '../types';
import { useSendSimulation } from './useSendSimulation';

function resolveLabel({
  formState,
  transaction,
  state,
  simulated,
  isPreparingTransaction,
}: {
  formState: SendFormState2;
  transaction: MultichainTransaction | null;
  state: 'idle' | 'simulating';
  simulated: boolean;
  isPreparingTransaction: boolean;
}): string {
  if (state === 'simulating') return 'Verifying Transaction';
  if (simulated) return 'Confirm Send';
  if (!formState.inputFungibleId && !formState.nftId) return 'Select Token';
  const isNft = Boolean(formState.nftId);
  if (isNft) {
    if (!formState.nftAmount || Number(formState.nftAmount) === 0) {
      return 'Enter an Amount';
    }
  } else if (!formState.inputAmount || Number(formState.inputAmount) === 0) {
    return 'Enter an Amount';
  }
  if (isPreparingTransaction && !transaction) return 'Preparing Transaction';
  return 'Send Now';
}

function isDisabled({
  formState,
  transaction,
  state,
  simulated,
  signing,
}: {
  formState: SendFormState2;
  transaction: MultichainTransaction | null;
  state: 'idle' | 'simulating';
  simulated: boolean;
  signing: boolean;
}) {
  if (signing) return true;
  if (state === 'simulating') return true;
  if (simulated) return false;
  if (!formState.inputFungibleId && !formState.nftId) return true;
  const isNft = Boolean(formState.nftId);
  if (isNft) {
    if (!formState.nftAmount || Number(formState.nftAmount) === 0) return true;
  } else if (!formState.inputAmount || Number(formState.inputAmount) === 0) {
    return true;
  }
  if (!transaction) return true;
  return false;
}

export function SendButton({
  address,
  formState,
  transaction,
  simulated,
  signing,
  isPreparingTransaction,
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
  onSimulationCompleted: (result: SimulationResult) => void;
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

  const { guardedFire, dialog: readonlyReceiverDialog } =
    useReadonlyReceiverGate({ to: formState.to, fire });
  const effectiveFire = simulated ? fire : guardedFire;

  const label = resolveLabel({
    formState,
    transaction,
    state,
    simulated,
    isPreparingTransaction,
  });
  const disabled = isDisabled({
    formState,
    transaction,
    state,
    simulated,
    signing,
  });

  const isDanger =
    Boolean(dangerTitle) && (state === 'simulating' || !disabled);

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
