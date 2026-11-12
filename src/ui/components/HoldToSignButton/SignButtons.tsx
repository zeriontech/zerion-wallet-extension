import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
import shieldSolidUrl from 'url:src/ui/assets/shield-solid.svg';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { Button } from 'src/ui/ui-kit/Button';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { KeyboardShortcut, ShortcutHint } from 'src/ui/components/KeyboardShortcut';
import { useWindowFocus } from 'src/ui/shared/useWindowFocus';
import * as styles from './SignButtons.module.css';

export type ButtonState = 'idle' | 'simulating';

const HOLD_DURATION = 1000;
const HOLD_DURATION_MARGIN = 100;
const SHORT_PRESS_DURATION = 200;
const HINT_SHOW_DURATION = 1500;
const HINT_SHOW_MIN_BREAK = 2000;

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
    [holdEnabled, onFire, startHold, cancelHold, isHolding],
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
  const keyboardShortcutEnabled = Boolean(preferences?.enableKeyboardShortcutToSign);
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
      <button type="button" className={styles.button} disabled={disabled} {...buttonHandlers}>
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
  const { isHolding, holdCompleted, showHoldHint, buttonHandlers } = useHoldToFire({
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
