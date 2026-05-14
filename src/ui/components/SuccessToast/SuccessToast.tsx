import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../TransactionSigner/Toaster/useReducedMotion';
import {
  getCurrentToast,
  subscribe,
  dismissSuccessToast,
  type SuccessToastState,
} from './successToastStore';
import * as s from './styles.module.css';

export { showSuccessToast } from './successToastStore';

const HOLD_MS = 2500;

const ENTRANCE_SPRING = {
  type: 'spring' as const,
  stiffness: 250,
  damping: 25,
};

function SuccessIcon({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.svg
      width={18}
      height={18}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <motion.path
        d="M3.5 8.5l3 3 6-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={
          reducedMotion
            ? { duration: 0.1 }
            : { duration: 0.25, ease: [0.32, 0.72, 0, 1], delay: 0.1 }
        }
      />
    </motion.svg>
  );
}

function useSuccessToastState(): SuccessToastState | null {
  const [state, setState] = useState<SuccessToastState | null>(() =>
    getCurrentToast()
  );
  useEffect(() => {
    return subscribe(() => {
      setState(getCurrentToast());
    });
  }, []);
  return state;
}

export function SuccessToast() {
  const reducedMotion = useReducedMotion();
  const current = useSuccessToastState();

  // Auto-dismiss after HOLD_MS once a toast appears. Re-arms on each new
  // toastId so back-to-back successes each get their full hold.
  useEffect(() => {
    if (!current) return;
    const { toastId } = current;
    const timer = setTimeout(() => {
      dismissSuccessToast(toastId);
    }, HOLD_MS);
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div className={s.root} aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {current ? (
          <motion.div
            key={current.toastId}
            className={s.pill}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -120, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -40, filter: 'blur(6px)', scale: 0.9 }
            }
            transition={
              reducedMotion
                ? { duration: 0.1 }
                : {
                    y: ENTRANCE_SPRING,
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2, ease: 'easeOut' },
                  }
            }
          >
            <div className={s.badge}>
              <SuccessIcon reducedMotion={reducedMotion} />
            </div>
            <div className={s.text}>
              <span>{current.text}</span>
              {current.subtitle ? (
                <span className={s.subtitle}>{current.subtitle}</span>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
