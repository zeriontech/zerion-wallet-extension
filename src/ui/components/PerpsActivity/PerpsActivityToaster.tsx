import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleSpinner } from 'src/ui/ui-kit/CircleSpinner';
import { TokenIcon } from 'src/ui/ui-kit/TokenIcon';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { useMeasure } from 'src/ui/shared/useMeasure';
import { registerPreviewPermanent } from 'src/ui-lab/previews/registerPreview';
import { getPerpIconUrl } from 'src/modules/hyperliquid/getPerpIconUrl';
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
import { ToasterLoaderLine } from '../TransactionSigner/Toaster/ToasterLoaderLine';
import { ToasterArrowDown } from './ToasterArrowDown';
import * as s from './styles.module.css';

// Spring for the compact → expanded growth (pill width + text reveal). Mirrors
// the TransactionToaster: high mass + soft stiffness ramp the width in gently.
const EXPAND_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 30,
  mass: 1.4,
};
const SCALE_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 15,
  mass: 1.4,
};
const SLIDE_EASE = [0.32, 0.72, 0, 1] as const;

// Width of the compact icon-only pill shown during the first entrance phase,
// before the text reveals. Icon slot (28px) + .measureWrap padding (24px left)
// leaves room for the icon to sit balanced while the text is clipped behind.
const COMPACT_WIDTH = 76;
// Hold the compact icon-only pill on screen this long before expanding.
const EXPAND_DELAY_MS = 400;
// The compact pill rests at this scale and grows to 1 as it expands.
const COMPACT_SCALE = 0.9;

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
  'perps-deposit': 'Deposit submitted',
  'perps-withdraw': 'Withdrawal submitted',
};

const SUCCESS_SUBTITLE: Partial<Record<PerpsActivityKind, string>> = {
  'perps-deposit': 'Funds may take a few minutes to settle',
  'perps-withdraw': 'Funds may take a few minutes to settle',
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
  if (session.terminal.state === 'success') {
    return SUCCESS_SUBTITLE[session.kind] ?? null;
  }
  return session.label;
}

type Terminal = PerpsActivitySession['terminal']['state'];

// The leading icon: while pending, the downward marching arrow for withdraw,
// the perp token icon when a coin is present, or a bare spinner; swaps to the
// success/failed status badge on terminal. The status badge is what
// TransactionToaster shows too — kept identical here.
function ToasterIconArea({
  session,
  terminal,
  isWithdraw,
  reducedMotion,
}: {
  session: PerpsActivitySession;
  terminal: Terminal;
  isWithdraw: boolean;
  reducedMotion: boolean;
}) {
  const iconUrl = session.coin ? getPerpIconUrl(session.coin) : null;
  return (
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
            transition={reducedMotion ? { duration: 0.1 } : { duration: 0.3 }}
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
            transition={reducedMotion ? { duration: 0.1 } : { duration: 0.3 }}
          >
            <CrossIcon reducedMotion={reducedMotion} />
          </motion.div>
        ) : isWithdraw ? (
          <motion.div
            key="withdraw-arrow"
            className={s.withdrawArrow}
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
            transition={reducedMotion ? { duration: 0.1 } : { duration: 0.3 }}
          >
            <ToasterArrowDown
              terminal={terminal}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        ) : iconUrl ? (
          <motion.div
            key={`coin-${session.coin}`}
            className={s.coinIcon}
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
            transition={reducedMotion ? { duration: 0.1 } : { duration: 0.3 }}
          >
            <TokenIcon src={iconUrl} symbol={session.coin ?? ''} size={28} />
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
            transition={reducedMotion ? { duration: 0.1 } : { duration: 0.3 }}
          >
            <CircleSpinner size="20px" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// The text column (title + subtitle), revealed as one unit after the icon-only
// entrance phase.
function ToasterTextArea({
  title,
  subtitle,
  reducedMotion,
}: {
  title: string;
  subtitle: string | null;
  reducedMotion: boolean;
}) {
  return (
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
          transition={reducedMotion ? { duration: 0.1 } : { duration: 0.3 }}
        >
          {title}
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
                : { duration: 0.22, ease: SLIDE_EASE }
            }
          >
            {subtitle}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function PerpsActivityToaster() {
  const reducedMotion = useReducedMotion();
  const session = useSession();

  const visible = session !== null;
  const title = session ? getTitle(session) : '';
  const subtitle = session ? getSubtitle(session) : null;
  const terminal: Terminal = session?.terminal.state ?? 'running';
  const isWithdraw = session?.kind === 'perps-withdraw';
  // Only show the top loader line when there's a real icon to anchor it under;
  // a bare-spinner pill already reads as "loading".
  const hasIcon = Boolean(session?.coin);

  const [measureRef, { width: contentWidth }] = useMeasure<HTMLDivElement>();

  // Two-phase entrance, ported from TransactionToaster: appear compact (icon
  // only) without any vertical shift, hold briefly, then expand to reveal the
  // text with a subtle scale swell.
  const [entrancePhase, setEntrancePhase] = useState<'compact' | 'expanded'>(
    'compact'
  );
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExitComplete = useCallback(() => {
    if (expandTimerRef.current != null) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    setEntrancePhase('compact');
  }, []);

  useEffect(
    () => () => {
      if (expandTimerRef.current != null) {
        clearTimeout(expandTimerRef.current);
      }
    },
    []
  );

  // Reduced motion skips the staged reveal: show the full pill at once.
  const expanded = entrancePhase === 'expanded' || reducedMotion;
  const targetWidth = expanded ? contentWidth + 44 || 'auto' : COMPACT_WIDTH;
  const targetScale = expanded ? 1 : COMPACT_SCALE;

  return (
    <div className={s.root} aria-live="polite" aria-atomic="true">
      <AnimatePresence onExitComplete={handleExitComplete}>
        {visible && session ? (
          <motion.div
            key="perps-pill"
            className={s.pill}
            initial={
              reducedMotion
                ? { opacity: 0, width: targetWidth }
                : { opacity: 0, scale: 0.8, width: COMPACT_WIDTH }
            }
            animate={{
              opacity: 1,
              scale: targetScale,
              width: targetWidth,
            }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, filter: 'blur(8px)', scale: 0.85 }
            }
            transition={
              reducedMotion
                ? { duration: 0.1 }
                : {
                    opacity: { duration: 0.2, ease: SLIDE_EASE },
                    // Clean settle for the compact appear (0.8 → 0.9), bouncy
                    // spring only for the expand swell (0.9 → 1).
                    scale: expanded
                      ? SCALE_SPRING
                      : { duration: 0.26, ease: SLIDE_EASE },
                    width: EXPAND_SPRING,
                  }
            }
            onAnimationComplete={() => {
              // After the compact appear settles, hold, then expand the text.
              if (!expanded && expandTimerRef.current == null) {
                expandTimerRef.current = setTimeout(() => {
                  expandTimerRef.current = null;
                  setEntrancePhase('expanded');
                }, EXPAND_DELAY_MS);
              }
            }}
          >
            {/* Top loader line, shown only while pending and only when an icon
                anchors it. It recolors + fades on terminal on its own. */}
            {hasIcon ? (
              <ToasterLoaderLine
                terminal={terminal === 'running' ? null : terminal}
              />
            ) : null}
            <div ref={measureRef} className={s.measureWrap}>
              <ToasterIconArea
                session={session}
                terminal={terminal}
                isWithdraw={isWithdraw}
                reducedMotion={reducedMotion}
              />
              {/* Always mounted so .measureWrap reports the full content width
                  from the first frame; the pill clips it behind COMPACT_WIDTH
                  while hidden. Reveal is a fade + scale-down on `expanded`. */}
              <motion.div
                className={s.textReveal}
                initial={false}
                animate={
                  expanded
                    ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                    : reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 1.08, filter: 'blur(2px)' }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.1 }
                    : {
                        scale: EXPAND_SPRING,
                        opacity: { duration: 0.22, ease: SLIDE_EASE },
                      }
                }
              >
                <ToasterTextArea
                  title={title}
                  subtitle={subtitle}
                  reducedMotion={reducedMotion}
                />
              </motion.div>
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

// Mirrors runIntent: position-acting kinds carry a coin (→ token icon + top
// loader line); deposit/withdraw carry none (→ bare spinner).
const PREVIEW_COIN: Partial<Record<PerpsActivityKind, string>> = {
  'perps-open': 'BTC',
  'perps-add': 'ETH',
  'perps-close': 'SOL',
};

function PerpsActivityToasterPreview() {
  const [kind, setKind] = useState<PerpsActivityKind>('perps-open');
  const [running, setRunning] = useState(false);
  useEffect(() => () => reset(), []);

  function runHappyPath() {
    setRunning(true);
    start({ kind, label: PREVIEW_FIRST_LABEL[kind], coin: PREVIEW_COIN[kind] });
    setTimeout(() => {
      advance({ label: PREVIEW_SECOND_LABEL[kind] });
    }, 1500);
    setTimeout(() => {
      succeed({ text: PREVIEW_SUCCESS_TEXT[kind] });
      setRunning(false);
    }, 3000);
  }

  function runFailPath() {
    setRunning(true);
    start({ kind, label: PREVIEW_FIRST_LABEL[kind], coin: PREVIEW_COIN[kind] });
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
