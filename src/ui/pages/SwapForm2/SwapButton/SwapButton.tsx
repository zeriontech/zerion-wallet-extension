import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import shieldSolidUrl from 'url:src/ui/assets/shield-solid.svg';
import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';
import type { Quote2 } from 'src/shared/types/Quote';
import { toMultichainTransaction } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import { HStack } from 'src/ui/ui-kit/HStack';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { interpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import type { SwapFormState2 } from '../types';
import * as styles from './SwapButton.module.css';

export type SimulationResult =
  | InterpretResponse
  | SignatureInterpretResponse
  | null;

type ButtonState = 'idle' | 'simulating';

function resolveLabel({
  formState,
  quote,
  quotesQuery,
  state,
}: {
  formState: SwapFormState2;
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  state: ButtonState;
}): string {
  if (state === 'simulating') {
    return 'Verifying Transaction';
  }
  if (!formState.outputFungibleId) {
    return 'Select token';
  }
  if (!formState.inputAmount || Number(formState.inputAmount) === 0) {
    return 'Enter an amount';
  }
  if (quote?.error) {
    return 'Review swap';
  }
  if (quotesQuery.isLoading && !quote) {
    return 'Getting quote';
  }
  return 'Review swap';
}

function isDisabled({
  quote,
  quotesQuery,
  formState,
  state,
}: {
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  formState: SwapFormState2;
  state: ButtonState;
}) {
  if (state === 'simulating') return true;
  if (!formState.outputFungibleId) return true;
  if (!formState.inputAmount || Number(formState.inputAmount) === 0)
    return true;
  if (!quote) return true;
  if (quote.error) return true;
  if (quotesQuery.isLoading) return true;
  return false;
}

function SimulatingIcon() {
  return (
    <div
      className={styles.shieldWrapper}
      style={{ ['--shield-mask' as string]: `url(${shieldSolidUrl})` }}
    >
      <div className={styles.shieldMask}>
        <div className={styles.shieldGradient} />
      </div>
    </div>
  );
}

export function SwapButton({
  address,
  formState,
  quote,
  quotesQuery,
  onSimulationCompleted,
}: {
  address: string;
  formState: SwapFormState2;
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  onSimulationCompleted: (result: SimulationResult) => void;
}) {
  const [state, setState] = useState<ButtonState>('idle');
  const { currency } = useCurrency();
  const { preferences } = usePreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';

  const transactions = useMemo<MultichainTransaction[]>(() => {
    if (!quote) return [];
    const list: MultichainTransaction[] = [];
    if (quote.transactionApprove) {
      list.push(toMultichainTransaction(quote.transactionApprove));
    }
    if (quote.transactionSwap) {
      list.push(toMultichainTransaction(quote.transactionSwap));
    }
    return list;
  }, [quote]);

  const canSimulate = state === 'simulating' && transactions.length > 0;

  const simulationQuery = useQuery({
    enabled: canSimulate,
    suspense: false,
    refetchOnWindowFocus: false,
    queryKey: [
      'swap-form-2/simulateTransactions',
      address,
      currency,
      transactions,
      source,
    ],
    queryFn: () =>
      interpretTxBasedOnEligibility({
        address,
        transactions,
        eligibilityQueryData: false,
        eligibilityQueryStatus: 'success',
        currency,
        origin: 'https://app.zerion.io',
      }),
  });

  useEffect(() => {
    if (state !== 'simulating') return;
    if (simulationQuery.isFetching) return;
    if (simulationQuery.isSuccess || simulationQuery.isError) {
      onSimulationCompleted(simulationQuery.data ?? null);
      setState('idle');
    }
  }, [
    state,
    simulationQuery.isFetching,
    simulationQuery.isSuccess,
    simulationQuery.isError,
    simulationQuery.data,
    onSimulationCompleted,
  ]);

  const label = resolveLabel({ formState, quote, quotesQuery, state });
  const disabled = isDisabled({ quote, quotesQuery, formState, state });

  return (
    <button
      type="button"
      className={styles.button}
      disabled={disabled}
      onClick={() => {
        if (!quote || transactions.length === 0) return;
        setState('simulating');
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={label}
          transition={{ duration: 0.15 }}
          initial={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
        >
          <HStack gap={8} alignItems="center" justifyContent="center">
            {state === 'simulating' ? <SimulatingIcon /> : null}
            <span>{label}</span>
          </HStack>
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
