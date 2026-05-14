import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { AnimatedDots } from 'src/ui/ui-kit/Dots';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { registerPreviewPermanent } from 'src/ui-lab/previews/registerPreview';
import {
  getSession,
  subscribe,
  start,
  advance,
  succeed,
  fail,
  reset,
  type PerpsActivityKind,
  type PerpsActivitySession,
} from 'src/modules/hyperliquid/perpsActivityStore';
import { useReducedMotion } from '../TransactionSigner/Toaster/useReducedMotion';
import { showSuccessToast } from '../SuccessToast';
import * as s from './styles.module.css';

const ENTRANCE_SPRING = {
  type: 'spring' as const,
  stiffness: 250,
  damping: 25,
};

const RUNNING_TITLE: Record<PerpsActivityKind, string> = {
  'perps-open': 'Opening position',
  'perps-add': 'Adding to position',
  'perps-close': 'Closing position',
  'perps-deposit': 'Depositing',
  'perps-withdraw': 'Withdrawing',
};

const SUCCESS_TITLE: Record<PerpsActivityKind, string> = {
  'perps-open': 'Position opened',
  'perps-add': 'Position updated',
  'perps-close': 'Position closed',
  'perps-deposit': 'Deposited',
  'perps-withdraw': 'Withdrawn',
};

const FAILED_TITLE: Record<PerpsActivityKind, string> = {
  'perps-open': 'Open failed',
  'perps-add': 'Update failed',
  'perps-close': 'Close failed',
  'perps-deposit': 'Deposit failed',
  'perps-withdraw': 'Withdraw failed',
};

function CheckIcon({ reducedMotion }: { reducedMotion: boolean }) {
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

function CrossIcon({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.svg
      width={18}
      height={18}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <motion.path
        d="M4 4l8 8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={
          reducedMotion
            ? { duration: 0.1 }
            : { duration: 0.2, ease: [0.32, 0.72, 0, 1], delay: 0.1 }
        }
      />
      <motion.path
        d="M12 4l-8 8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={
          reducedMotion
            ? { duration: 0.1 }
            : { duration: 0.2, ease: [0.32, 0.72, 0, 1], delay: 0.2 }
        }
      />
    </motion.svg>
  );
}

function useSession(): PerpsActivitySession | null {
  const [state, setState] = useState<PerpsActivitySession | null>(() =>
    getSession()
  );
  useEffect(() => {
    return subscribe(() => {
      setState(getSession());
    });
  }, []);
  return state;
}

function getTitle(session: PerpsActivitySession): string {
  if (session.terminal.state === 'success') return SUCCESS_TITLE[session.kind];
  if (session.terminal.state === 'failed') return FAILED_TITLE[session.kind];
  return RUNNING_TITLE[session.kind];
}

function getSubtitle(session: PerpsActivitySession): string | null {
  if (session.terminal.state === 'failed') {
    return session.terminal.error.message || null;
  }
  // Running state surfaces the per-step label; success shows nothing
  // (the global SuccessToast carries the success copy).
  if (session.terminal.state === 'running') return session.label;
  return null;
}

export function PerpsActivityToaster() {
  const reducedMotion = useReducedMotion();
  const session = useSession();

  const visible = session !== null;
  const title = session ? getTitle(session) : '';
  const subtitle = session ? getSubtitle(session) : null;
  const terminal = session?.terminal.state ?? 'running';

  return (
    <div className={s.root} aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {visible && session ? (
          <motion.div
            key="perps-pill"
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
            <div className={s.iconWrap}>
              <AnimatePresence initial={false} mode="popLayout">
                {terminal === 'success' ? (
                  <motion.div
                    key="success"
                    className={`${s.statusBadge} ${s.statusBadgeSuccess}`}
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.6, filter: 'blur(8px)' }
                    }
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.6, filter: 'blur(8px)' }
                    }
                    transition={
                      reducedMotion ? { duration: 0.1 } : { duration: 0.3 }
                    }
                  >
                    <CheckIcon reducedMotion={reducedMotion} />
                  </motion.div>
                ) : terminal === 'failed' ? (
                  <motion.div
                    key="failed"
                    className={`${s.statusBadge} ${s.statusBadgeFailed}`}
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.6, filter: 'blur(8px)' }
                    }
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.6, filter: 'blur(8px)' }
                    }
                    transition={
                      reducedMotion ? { duration: 0.1 } : { duration: 0.3 }
                    }
                  >
                    <CrossIcon reducedMotion={reducedMotion} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="running"
                    className={s.spinner}
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.6, filter: 'blur(8px)' }
                    }
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.6, filter: 'blur(8px)' }
                    }
                    transition={
                      reducedMotion ? { duration: 0.1 } : { duration: 0.3 }
                    }
                  >
                    <CircleSpinner size="20px" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className={s.text}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={title}
                  initial={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 8, filter: 'blur(2px)' }
                  }
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -8, filter: 'blur(2px)' }
                  }
                  transition={
                    reducedMotion ? { duration: 0.1 } : { duration: 0.3 }
                  }
                >
                  {title}
                  {terminal === 'running' ? <AnimatedDots /> : null}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="popLayout" initial={false}>
                {subtitle ? (
                  <motion.span
                    key={subtitle}
                    className={s.subtitle}
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 8, filter: 'blur(2px)' }
                    }
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -8, filter: 'blur(2px)' }
                    }
                    transition={
                      reducedMotion
                        ? { duration: 0.1 }
                        : { duration: 0.22, ease: [0.32, 0.72, 0, 1] }
                    }
                  >
                    {subtitle}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const PREVIEW_KINDS: PerpsActivityKind[] = [
  'perps-open',
  'perps-add',
  'perps-close',
  'perps-deposit',
  'perps-withdraw',
];

const PREVIEW_FIRST_LABEL: Record<PerpsActivityKind, string> = {
  'perps-open': 'Setting leverage',
  'perps-add': 'Placing order',
  'perps-close': 'Placing close order',
  'perps-deposit': 'Approving USDC',
  'perps-withdraw': 'Signing withdrawal',
};

const PREVIEW_SECOND_LABEL: Record<PerpsActivityKind, string> = {
  'perps-open': 'Placing order',
  'perps-add': 'Confirming',
  'perps-close': 'Confirming',
  'perps-deposit': 'Bridging to Hypercore',
  'perps-withdraw': 'Submitting to Hyperliquid',
};

const PREVIEW_SUCCESS_TEXT: Record<PerpsActivityKind, string> = {
  'perps-open': 'Position opened',
  'perps-add': 'Position updated',
  'perps-close': 'Position closed',
  'perps-deposit': 'Deposit submitted',
  'perps-withdraw': 'Withdrawal submitted',
};

const PREVIEW_SETTLE_SUBTITLE: Partial<Record<PerpsActivityKind, string>> = {
  'perps-deposit': 'May take a few minutes',
  'perps-withdraw': 'May take a few minutes',
};

function PerpsActivityToasterPreview() {
  const [kind, setKind] = useState<PerpsActivityKind>('perps-open');
  const [running, setRunning] = useState(false);
  useEffect(() => () => reset(), []);

  function runHappyPath() {
    setRunning(true);
    start({ kind, label: PREVIEW_FIRST_LABEL[kind] });
    setTimeout(() => {
      advance({ label: PREVIEW_SECOND_LABEL[kind] });
    }, 1500);
    setTimeout(() => {
      succeed({ text: PREVIEW_SUCCESS_TEXT[kind] });
      showSuccessToast({
        text: PREVIEW_SUCCESS_TEXT[kind],
        subtitle: PREVIEW_SETTLE_SUBTITLE[kind],
      });
      setRunning(false);
    }, 3000);
  }

  function runFailPath() {
    setRunning(true);
    start({ kind, label: PREVIEW_FIRST_LABEL[kind] });
    setTimeout(() => {
      fail(new Error('Insufficient margin'));
      setRunning(false);
    }, 1500);
  }

  return (
    <VStack gap={16}>
      <UIText kind="caption/regular" color="var(--neutral-700)">
        Toaster pills render at the App root — they appear top-center over the
        full viewport, not inside this preview area.
      </UIText>
      <HStack gap={8} style={{ flexWrap: 'wrap' }}>
        {PREVIEW_KINDS.map((k) => (
          <Button
            key={k}
            kind={kind === k ? 'primary' : 'regular'}
            size={32}
            onClick={() => setKind(k)}
          >
            {k.replace('perps-', '')}
          </Button>
        ))}
      </HStack>
      <HStack gap={8} style={{ flexWrap: 'wrap' }}>
        <Button
          kind="primary"
          size={36}
          onClick={runHappyPath}
          disabled={running}
        >
          Run happy path
        </Button>
        <Button
          kind="regular"
          size={36}
          onClick={runFailPath}
          disabled={running}
        >
          Run fail path
        </Button>
        <Button
          kind="regular"
          size={36}
          onClick={() =>
            showSuccessToast({
              text: PREVIEW_SUCCESS_TEXT[kind],
              subtitle: PREVIEW_SETTLE_SUBTITLE[kind],
            })
          }
        >
          Success toast only
        </Button>
        <Button kind="regular" size={36} onClick={reset}>
          Reset
        </Button>
      </HStack>
    </VStack>
  );
}

registerPreviewPermanent({
  name: 'PerpsActivityToaster',
  component: () => <PerpsActivityToasterPreview />,
});
