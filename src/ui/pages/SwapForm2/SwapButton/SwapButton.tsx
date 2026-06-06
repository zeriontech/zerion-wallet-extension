import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import cn from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import shieldSolidUrl from 'url:src/ui/assets/shield-solid.svg';
import type { InterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-transaction';
import type { SignatureInterpretResponse } from 'src/modules/zerion-api/requests/wallet-simulate-signature';
import type { Quote2 } from 'src/shared/types/Quote';
import { toMultichainTransaction } from 'src/shared/types/Quote';
import type { MultichainTransaction } from 'src/shared/types/MultichainTransaction';
import type { ChainGasPrice } from 'src/modules/ethereum/transactions/gasPrices/types';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { interpretTxBasedOnEligibility } from 'src/ui/shared/requests/uiInterpretTransaction';
import type { QuotesData } from 'src/ui/shared/requests/useQuotes';
import { applySimulationPatch } from 'src/ui/features/dev-menu/applySimulationPatch';
import { devMenuStore } from 'src/ui/features/dev-menu/store';
import {
  KeyboardShortcut,
  ShortcutHint,
} from 'src/ui/components/KeyboardShortcut';
import { useWindowFocus } from 'src/ui/shared/useWindowFocus';
import { useReadonlyReceiverGate } from 'src/ui/components/ReadonlyReceiverDialog';
import { toConfiguration } from '../../SendForm/shared/helpers';
import { applyTransactionConfiguration } from '../applyTransactionConfiguration';
import { useSwapButtonOnboardingGate } from '../SwapButtonOnboardingDialog/useSwapButtonOnboardingGate';
import type { SwapFormState2 } from '../types';
import * as styles from './SwapButton.module.css';

export type SimulationResult =
  | InterpretResponse
  | SignatureInterpretResponse
  | null;

type ButtonState = 'idle' | 'simulating';

const HOLD_DURATION = 1000;
const HOLD_DURATION_MARGIN = 100;
const SHORT_PRESS_DURATION = 200;
const HINT_SHOW_DURATION = 1500;
const HINT_SHOW_MIN_BREAK = 2000;

function resolveLabel({
  formState,
  quote,
  quotesQuery,
  state,
  simulated,
  isCrossEcosystem,
  receiverEcosystemMismatch,
  isCrossChain,
}: {
  formState: SwapFormState2;
  quote: Quote2 | null;
  quotesQuery: QuotesData<Quote2>;
  state: ButtonState;
  simulated: boolean;
  isCrossEcosystem: boolean;
  receiverEcosystemMismatch: boolean;
  isCrossChain: boolean;
}): string {
  if (state === 'simulating') {
    return 'Verifying Transaction';
  }
  if (simulated) {
    return 'Confirm Swap';
  }
  if (!formState.outputFungibleId) {
    return 'Select Token';
  }
  if (!formState.inputAmount || Number(formState.inputAmount) === 0) {
    return 'Enter an Amount';
  }
  if (isCrossEcosystem && !formState.to) {
    return 'Enter Recipient Address';
  }
  if (isCrossEcosystem && receiverEcosystemMismatch) {
    return 'Unable to Swap';
  }
  if (quote?.error) {
    return 'Unable to Swap';
  }
  if (quotesQuery.isLoading && !quote) {
    return 'Getting quote';
  }
  if (formState.to) {
    return isCrossChain ? 'Bridge & Send Now' : 'Send Now';
  }
  return isCrossChain ? 'Bridge Now' : 'Swap Now';
}

function isDisabled({
  quote,
  formState,
  state,
  simulated,
  signing,
  isCrossEcosystem,
  receiverEcosystemMismatch,
}: {
  quote: Quote2 | null;
  formState: SwapFormState2;
  state: ButtonState;
  simulated: boolean;
  signing: boolean;
  isCrossEcosystem: boolean;
  receiverEcosystemMismatch: boolean;
}) {
  if (signing) return true;
  if (state === 'simulating') return true;
  if (simulated) return false;
  if (!formState.outputFungibleId) return true;
  if (!formState.inputAmount || Number(formState.inputAmount) === 0)
    return true;
  if (isCrossEcosystem && !formState.to) return true;
  if (isCrossEcosystem && receiverEcosystemMismatch) return true;
  if (!quote) return true;
  if (quote.error) return true;
  return false;
}

export function SimulatingIcon() {
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

export function HoldHint() {
  return (
    <div className={styles.holdHintContainer}>
      <UIText kind="caption/accent" className={styles.holdHint}>
        Please press and hold the button
      </UIText>
    </div>
  );
}

function useSimulation({
  address,
  formState,
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
  const { currency } = useCurrency();

  const transactions = useMemo<MultichainTransaction[]>(() => {
    if (!quote) return [];
    // Apply the local network-fee override so the simulation reflects what
    // will actually be signed.
    const configuredQuote = applyTransactionConfiguration(
      quote,
      toConfiguration(formState),
      gasPrices
    );
    const list: MultichainTransaction[] = [];
    if (configuredQuote.transactionApprove) {
      list.push(toMultichainTransaction(configuredQuote.transactionApprove));
    }
    if (configuredQuote.transactionSwap) {
      list.push(toMultichainTransaction(configuredQuote.transactionSwap));
    }
    return list;
  }, [quote, formState, gasPrices]);

  const simulationMutation = useMutation({
    mutationFn: (txs: MultichainTransaction[]) =>
      interpretTxBasedOnEligibility({
        address,
        transactions: txs,
        eligibilityQueryData: false,
        eligibilityQueryStatus: 'success',
        currency,
        origin: 'https://app.zerion.io',
      }),
    onSettled: (data) => {
      const patched = applySimulationPatch(data, devMenuStore.getState());
      onSimulationCompleted(patched ?? null);
    },
  });

  const state: ButtonState = simulationMutation.isLoading
    ? 'simulating'
    : 'idle';

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

export function useHoldToFire({
  onFire,
  holdEnabled,
  disabled,
  shortPressThreshold,
}: {
  onFire: () => void;
  holdEnabled: boolean;
  disabled: boolean;
  shortPressThreshold: number;
}) {
  const [isHolding, setIsHolding] = useState(false);
  const [holdCompleted, setHoldCompleted] = useState(false);
  const [showHoldHint, setShowHoldHint] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef = useRef<number>(0);
  const shortPressCounterRef = useRef<number>(0);
  const lastHintShownAtRef = useRef<number>(0);

  const displayHoldHint = useCallback(() => {
    lastHintShownAtRef.current = Date.now();
    shortPressCounterRef.current = 0;
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setShowHoldHint(true);
    hintTimerRef.current = setTimeout(() => {
      setShowHoldHint(false);
      hintTimerRef.current = null;
    }, HINT_SHOW_DURATION);
  }, []);

  const startHold = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdStartRef.current = Date.now();
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setHoldCompleted(true);
      onFire();
    }, HOLD_DURATION + HOLD_DURATION_MARGIN);
  }, [onFire]);

  const cancelHold = useCallback(() => {
    const wasHolding = holdTimerRef.current != null;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    if (!wasHolding) return;
    if (Date.now() - holdStartRef.current < SHORT_PRESS_DURATION) {
      shortPressCounterRef.current += 1;
    } else {
      shortPressCounterRef.current = 0;
    }
    if (
      shortPressCounterRef.current >= shortPressThreshold &&
      Date.now() - lastHintShownAtRef.current > HINT_SHOW_MIN_BREAK
    ) {
      displayHoldHint();
    }
  }, [displayHoldHint, shortPressThreshold]);

  useEffect(() => {
    if (disabled && isHolding) {
      cancelHold();
    }
  }, [disabled, isHolding, cancelHold]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const buttonHandlers = useMemo(
    () => ({
      onClick: (e: React.MouseEvent) => {
        if (holdEnabled) {
          e.preventDefault();
          return;
        }
        onFire();
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (!holdEnabled) return;
        if (!e.isPrimary || e.button !== 0) return;
        e.preventDefault();
        startHold();
      },
      onPointerUp: () => {
        if (!holdEnabled) return;
        cancelHold();
      },
      onPointerCancel: () => {
        if (!holdEnabled) return;
        cancelHold();
      },
      onPointerLeave: () => {
        if (!holdEnabled) return;
        cancelHold();
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!holdEnabled) return;
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (isHolding) return;
        startHold();
      },
      onKeyUp: (e: React.KeyboardEvent) => {
        if (!holdEnabled) return;
        if (e.key !== 'Enter') return;
        cancelHold();
      },
      onBlur: () => {
        if (!holdEnabled) return;
        cancelHold();
      },
    }),
    [holdEnabled, onFire, startHold, cancelHold, isHolding]
  );

  return { isHolding, holdCompleted, showHoldHint, buttonHandlers };
}

export function RegularSignButton({
  state,
  fire,
  label,
  disabled,
}: {
  state: ButtonState;
  fire: () => void;
  label: string;
  disabled: boolean;
}) {
  const { preferences } = usePreferences();
  const holdEnabled = Boolean(preferences?.enableHoldToSignButton);
  const keyboardShortcutEnabled = Boolean(
    preferences?.enableKeyboardShortcutToSign
  );
  const windowFocused = useWindowFocus();
  const shortcutActive = keyboardShortcutEnabled && !disabled;

  const { isHolding, showHoldHint, buttonHandlers } = useHoldToFire({
    onFire: fire,
    holdEnabled,
    disabled,
    shortPressThreshold: 2,
  });

  return (
    <>
      <KeyboardShortcut
        combination="mod+enter"
        onKeyDown={() => fire()}
        disabled={!shortcutActive}
        availableDuringInputs={true}
      />
      <button
        type="button"
        className={styles.button}
        disabled={disabled}
        {...buttonHandlers}
      >
        {holdEnabled ? (
          <div
            className={cn(styles.holdOverlay, {
              [styles.holdOverlayActive]: isHolding,
            })}
          />
        ) : null}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            className={styles.label}
            transition={{ duration: 0.15 }}
            initial={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
          >
            <HStack gap={8} alignItems="center" justifyContent="center">
              {state === 'simulating' ? <SimulatingIcon /> : null}
              <span>{label}</span>
              {shortcutActive && windowFocused ? <ShortcutHint /> : null}
            </HStack>
          </motion.span>
        </AnimatePresence>
      </button>
      {showHoldHint ? <HoldHint /> : null}
    </>
  );
}

export function DangerSignButton({
  state,
  fire,
  dangerTitle,
  onCancel,
}: {
  state: ButtonState;
  fire: () => void;
  dangerTitle: string;
  onCancel: () => void;
}) {
  const { isHolding, holdCompleted, showHoldHint, buttonHandlers } =
    useHoldToFire({
      onFire: fire,
      holdEnabled: true,
      disabled: false,
      shortPressThreshold: 1,
    });

  const sweepFilled = isHolding || holdCompleted || state === 'simulating';
  const showCancel = state !== 'simulating';
  const label = state === 'simulating' ? 'Verifying Transaction' : dangerTitle;

  return (
    <>
      <div className={styles.dangerRow}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.button
            type="button"
            layoutId="danger-button"
            className={styles.dangerButton}
            transition={{ duration: 0.2 }}
            {...buttonHandlers}
          >
            <div
              className={cn(styles.dangerHoldFill, {
                [styles.dangerHoldFillActive]: sweepFilled,
              })}
            />
            <span className={styles.dangerLabelBase}>
              <HStack gap={8} alignItems="center" justifyContent="center">
                <span>{dangerTitle}</span>
              </HStack>
            </span>
            <span
              aria-hidden
              className={cn(styles.dangerLabelOverlay, {
                [styles.dangerLabelOverlayActive]: sweepFilled,
              })}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={label}
                  className={styles.dangerLabelInner}
                  transition={{ duration: 0.15 }}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                >
                  <HStack gap={8} alignItems="center" justifyContent="center">
                    {state === 'simulating' ? <SimulatingIcon /> : null}
                    <span>{label}</span>
                  </HStack>
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.button>

          {showCancel ? (
            <motion.div
              key="cancel"
              layout
              className={styles.cancelWrap}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                kind="primary"
                onClick={onCancel}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 16,
                  paddingInline: 24,
                }}
              >
                Cancel
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {showHoldHint ? <HoldHint /> : null}
    </>
  );
}

export function SwapButton({
  address,
  formState,
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

  const isDanger =
    Boolean(dangerTitle) && (state === 'simulating' || !disabled);

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
