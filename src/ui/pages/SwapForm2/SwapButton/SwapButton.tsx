import React, { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Quote2 } from 'src/shared/types/Quote';
import { toMultichainTransaction } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { CustomConfiguration } from 'src/shared/types/TransactionConfiguration';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import {
  useSimulateTransactions,
  type SimulationResult,
} from 'src/ui/shared/requests/useSimulateTransactions';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { useReadonlyReceiverGate } from 'src/ui/components/ReadonlyReceiverDialog';
import { applyTransactionConfiguration } from '../applyTransactionConfiguration';
import { useSwapButtonOnboardingGate } from '../SwapButtonOnboardingDialog/useSwapButtonOnboardingGate';
import type { SwapFormState2 } from '../types';
import { isDisabled, resolveLabel, resolveLinkTarget } from './resolveSwapButtonState';
import {
  DangerSignButton,
  RegularSignButton,
  type ButtonState,
} from 'src/ui/components/HoldToSignButton';
import { Button } from 'src/ui/ui-kit/Button';
import { UnstyledLink } from 'src/ui/ui-kit/UnstyledLink';

export type { SimulationResult };

function useSimulation({
  address,
  formState,
  configuration,
  quote,
  quotesQuery,
  gasPrices,
  simulated,
  signing,
  isCrossEcosystem,
  receiverEcosystemMismatch,
  isCrossChain,
  onSimulationCompleted,
  onSign,
}: {
  address: string;
  formState: SwapFormState2;
  configuration: CustomConfiguration;
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  gasPrices: ChainGasPrice | null;
  simulated: boolean;
  signing: boolean;
  isCrossEcosystem: boolean;
  receiverEcosystemMismatch: boolean;
  isCrossChain: boolean;
  onSimulationCompleted: (result: SimulationResult) => void;
  onSign: () => void;
}) {
  const transactions = useMemo<MultichainTransaction[]>(() => {
    if (!quote) return [];
    // Apply the local network-fee override so the simulation reflects what
    // will actually be signed.
    const configuredQuote = applyTransactionConfiguration(quote, configuration, gasPrices);
    const list: MultichainTransaction[] = [];
    if (configuredQuote.transactionApprove) {
      list.push(toMultichainTransaction(configuredQuote.transactionApprove));
    }
    if (configuredQuote.transactionSwap) {
      list.push(toMultichainTransaction(configuredQuote.transactionSwap));
    }
    return list;
  }, [quote, configuration, gasPrices]);

  const simulationMutation = useSimulateTransactions({
    address,
    onSettled: (result) => onSimulationCompleted(result),
  });

  const state: ButtonState = simulationMutation.isLoading ? 'simulating' : 'idle';

  const fire = useCallback(() => {
    if (simulated) {
      onSign();
      return;
    }
    if (!quote || transactions.length === 0) return;
    simulationMutation.mutate(transactions);
  }, [simulated, onSign, quote, transactions, simulationMutation]);

  const label = resolveLabel({
    formState,
    quote,
    quotesQuery,
    state,
    simulated,
    isCrossEcosystem,
    receiverEcosystemMismatch,
    isCrossChain,
  });
  const disabled = isDisabled({
    quote,
    formState,
    state,
    simulated,
    signing,
    isCrossEcosystem,
    receiverEcosystemMismatch,
  });

  return { state, fire, label, disabled };
}

export function SwapButton({
  address,
  formState,
  configuration,
  quote,
  quotesQuery,
  gasPrices,
  simulated,
  signing,
  isCrossEcosystem,
  receiverEcosystemMismatch,
  isCrossChain,
  onSimulationCompleted,
  onSign,
  dangerTitle,
  onCancel,
}: {
  address: string;
  formState: SwapFormState2;
  configuration: CustomConfiguration;
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  gasPrices: ChainGasPrice | null;
  simulated: boolean;
  signing: boolean;
  isCrossEcosystem: boolean;
  receiverEcosystemMismatch: boolean;
  isCrossChain: boolean;
  onSimulationCompleted: (result: SimulationResult) => void;
  onSign: () => void;
  dangerTitle?: string;
  onCancel: () => void;
}) {
  const { state, fire, label, disabled } = useSimulation({
    address,
    formState,
    configuration,
    quote,
    quotesQuery,
    gasPrices,
    simulated,
    signing,
    isCrossEcosystem,
    receiverEcosystemMismatch,
    isCrossChain,
    onSimulationCompleted,
    onSign,
  });

  const { guardedFire: readonlyGuardedFire, dialog: readonlyReceiverDialog } =
    useReadonlyReceiverGate({ to: formState.to, fire });
  const { guardedFire: onboardingGuardedFire, dialog: onboardingDialog } =
    useSwapButtonOnboardingGate({ fire: readonlyGuardedFire, simulated });
  const effectiveFire = simulated ? fire : onboardingGuardedFire;

  const isDanger = Boolean(dangerTitle) && (state === 'simulating' || !disabled);
  const linkTarget = disabled ? null : resolveLinkTarget(quote);

  return (
    <>
      {readonlyReceiverDialog}
      {onboardingDialog}
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
            {linkTarget ? (
              <Button
                kind="primary"
                as={UnstyledLink}
                to={linkTarget}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 16,
                  paddingInline: 24,
                }}
              >
                {label}
              </Button>
            ) : (
              <RegularSignButton
                state={state}
                fire={effectiveFire}
                label={label}
                disabled={disabled}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
