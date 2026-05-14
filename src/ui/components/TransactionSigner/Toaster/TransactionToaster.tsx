import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue } from 'motion/react';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { useMeasure } from 'src/ui/shared/useMeasure';
import { AnimatedDots } from 'src/ui/ui-kit/Dots';
import type { ToasterView } from '../types';
import { ToasterIcons } from './ToasterIcons';
import { ToasterLoaderLine } from './ToasterLoaderLine';
import { ToasterStatusBadge } from './ToasterStatusBadge';
import { useReducedMotion } from './useReducedMotion';
import {
  useToasterSession,
  type ActiveStepView,
  type TerminalKind,
} from './useToasterSession';
import {
  getAnchorStyle,
  isLeft,
  isRight,
  isTop,
  useSnapPosition,
  type SnapPosition,
} from './useSnapPosition';
import * as s from './styles.module.css';

const ENTRANCE_SPRING = {
  type: 'spring' as const,
  stiffness: 250,
  damping: 25,
};
const SLIDE_EASE = [0.32, 0.72, 0, 1] as const;

const HISTORY_PATH = '/overview/history';

const PROGRESS_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approving',
  swap: 'Swapping',
  bridge: 'Bridging',
  send: 'Sending',
};

const SUCCESS_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approved',
  swap: 'Swapped',
  bridge: 'Bridged',
  send: 'Sent',
};

const FAILED_TITLE: Record<ToasterView['kind'], string> = {
  approve: 'Approve failed',
  swap: 'Swap failed',
  bridge: 'Bridge failed',
  send: 'Send failed',
};

function getTitle(
  view: ToasterView | undefined,
  terminal: TerminalKind | null
): string {
  if (terminal === 'failed') {
    if (!view) return 'Failed';
    return FAILED_TITLE[view.kind];
  }
  if (terminal === 'success') {
    if (!view) return 'Done';
    if (view.kind === 'bridge') return 'Cross-chain swaps';
    return SUCCESS_TITLE[view.kind];
  }
  if (!view) return 'Executing';
  return PROGRESS_TITLE[view.kind];
}

function getSubtitle(
  view: ToasterView | undefined,
  terminal: TerminalKind | null
): string | null {
  if (!view) return null;
  if (terminal === 'success' && view.kind === 'bridge') {
    return 'may take a few minutes';
  }
  if (view.kind === 'approve') return view.token.symbol;
  if (view.kind === 'send') {
    const target =
      view.recipient.name ?? truncateAddress(view.recipient.address, 4);
    return `${view.token.symbol} → ${target}`;
  }
  return `${view.sent.symbol} → ${view.received.symbol}`;
}

const EXIT_DISTANCE = 50;

function getExitOffset(position: SnapPosition): { x: number; y: number } {
  const x = isLeft(position)
    ? -EXIT_DISTANCE
    : isRight(position)
    ? EXIT_DISTANCE
    : 0;
  const y = isTop(position) ? -EXIT_DISTANCE : EXIT_DISTANCE;
  return { x, y };
}

function ToasterContent({
  step,
  terminal,
  reducedMotion,
  pendingQueueCount,
}: {
  step: ActiveStepView | null;
  terminal: TerminalKind | null;
  reducedMotion: boolean;
  pendingQueueCount: number;
}) {
  const view = step?.toaster;
  const title = getTitle(view, terminal);
  const subtitle = getSubtitle(view, terminal);

  return (
    <motion.div
      className={s.body}
      transition={
        reducedMotion
          ? { duration: 0.1 }
          : { layout: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }
      }
    >
      <motion.div className={s.iconWrap}>
        <AnimatePresence initial={false} mode="popLayout">
          {terminal ? (
            <motion.div
              key="status"
              className={s.statusBadgeOverlay}
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
              <ToasterStatusBadge
                kind={terminal}
                reducedMotion={reducedMotion}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`icons-${step?.toaster?.kind ?? 'none'}`}
              className={s.iconLayer}
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
              <ToasterIcons view={view} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div className={s.text}>
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
            {terminal ? null : <AnimatedDots />}
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
      </motion.div>
      <AnimatePresence mode="popLayout" initial={false}>
        {pendingQueueCount > 0 ? (
          <motion.span
            key={pendingQueueCount}
            className={s.counter}
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
            {`+${pendingQueueCount}`}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function TransactionToaster() {
  const session = useToasterSession();
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const [measureRef, { width: contentWidth }] = useMeasure<HTMLDivElement>();
  const pillRef = useRef<HTMLButtonElement>(null);
  const { computeNextPosition } = useSnapPosition({
    pillRef,
  });
  // CSS anchor is fixed at top-center for the lifetime of the pill — drag
  // offset on dragX/dragY drives the visual position. Updating the CSS anchor
  // mid-life would cause a visual jump (the offset is relative to the OLD
  // anchor) and potentially push the pill outside drag constraints.
  const position: SnapPosition = 'top-center';
  // Quadrant the pill was last released into — used only to pick the exit
  // direction. Updated on drag end. Does NOT affect CSS layout.
  const [exitQuadrant, setExitQuadrant] = useState<SnapPosition>('top-center');

  const [hasEntered, setHasEntered] = useState(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const justDraggedRef = useRef(false);

  // The parent component stays mounted across toaster sessions; only the
  // inner motion.button mounts/unmounts via AnimatePresence. Reset pill-local
  // state AFTER the exit animation completes (via AnimatePresence's
  // onExitComplete) so the next entrance starts from a clean slate — no
  // leftover drag offset, entrance gate re-armed, default exit direction.
  // Resetting earlier would interrupt the exit animation in flight.
  const handleExitComplete = useCallback(() => {
    dragX.set(0);
    dragY.set(0);
    setHasEntered(false);
    setExitQuadrant('top-center');
  }, [dragX, dragY]);

  const handleClick = useCallback(() => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    navigate(HISTORY_PATH);
  }, [navigate]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(HISTORY_PATH);
      }
    },
    [navigate]
  );

  const handleDragStart = useCallback(() => {
    // Set BEFORE the browser's synthetic click fires on pointer-up. With
    // inertia (dragMomentum), onDragEnd fires after inertia settles — too
    // late to suppress the click that fires on pointer release.
    justDraggedRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    // Track which quadrant the pill was released into so the exit animation
    // flies toward the nearest edge. CSS anchor is NOT changed — that would
    // jump the pill (drag offset is relative to the old anchor).
    const next = computeNextPosition();
    if (next) {
      setExitQuadrant(next);
    }
  }, [computeNextPosition]);

  // Constrain drag to viewport so the pill can't be lost off-screen.
  // The dragArea div is fixed at viewport inset 16px; motion uses its bounds
  // automatically.
  const dragAreaRef = useRef<HTMLDivElement>(null);

  const exitOffset = getExitOffset(exitQuadrant);

  return (
    <div className={s.root} aria-live="polite" aria-atomic="true">
      <div ref={dragAreaRef} className={s.dragArea} />
      <AnimatePresence onExitComplete={handleExitComplete}>
        {session.visible ? (
          <motion.button
            ref={pillRef}
            key="pill"
            type="button"
            className={s.pill}
            style={{
              ...getAnchorStyle(position),
              x: dragX,
              y: dragY,
              cursor: hasEntered ? 'grab' : 'pointer',
            }}
            initial={
              reducedMotion
                ? { opacity: 0, width: contentWidth || 'auto' }
                : { opacity: 0, y: -120, width: contentWidth || 'auto' }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              width: contentWidth + 48 || 'auto',
            }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: exitOffset.x,
                    y: exitOffset.y,
                    filter: 'blur(8px)',
                    scale: 0.8,
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0.1 }
                : {
                    y: ENTRANCE_SPRING,
                    opacity: { duration: 0.2, ease: SLIDE_EASE },
                    scale: { duration: 0.2, ease: 'easeOut' },
                    width: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
                  }
            }
            whileHover={
              reducedMotion || !hasEntered ? undefined : { scale: 1.02 }
            }
            whileDrag={reducedMotion ? undefined : { scale: 1.05 }}
            drag={hasEntered && !reducedMotion}
            dragMomentum
            dragTransition={{
              power: 0.15,
              timeConstant: 200,
              bounceStiffness: 400,
              bounceDamping: 30,
            }}
            dragElastic={0.05}
            dragConstraints={dragAreaRef}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onAnimationComplete={(definition) => {
              if (
                !hasEntered &&
                typeof definition === 'object' &&
                definition !== null &&
                'y' in definition &&
                (definition as { y?: number }).y === 0
              ) {
                setHasEntered(true);
              }
            }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          >
            <div ref={measureRef} className={s.measureWrap}>
              <ToasterContent
                step={session.current}
                terminal={session.terminal}
                reducedMotion={reducedMotion}
                pendingQueueCount={session.pendingQueueCount}
              />
            </div>
            {reducedMotion ? null : (
              <ToasterLoaderLine terminal={session.terminal} />
            )}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
