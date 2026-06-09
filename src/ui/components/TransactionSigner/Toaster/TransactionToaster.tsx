import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue } from 'motion/react';
import { truncateAddress } from 'src/ui/shared/truncateAddress';
import { useMeasure } from 'src/ui/shared/useMeasure';
import type { ToasterView } from '../types';
import { ToasterArrow } from './ToasterArrow';
import { ToasterIcons } from './ToasterIcons';
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

const SLIDE_EASE = [0.32, 0.72, 0, 1] as const;

// Spring used for the compact → expanded growth (pill width + text reveal).
// Higher mass + softer stiffness give a gentler ramp-in (a pure spring starts
// at peak velocity and snaps on the first frame); damping stays high enough to
// land softly with little overshoot, keeping the per-frame reflow cheap.
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

// Width of the compact icon-only pill shown during the first entrance phase,
// before the text reveals. Icon slot (40px) + .measureWrap padding (16px each
// side) would be 72px; the chain badge (.chainBadgeFront) overflows the slot
// by 3px on the right, and the icon stays flush-left, so the extra width adds
// breathing room on the right to balance the compact view.
const COMPACT_WIDTH = 84;

// Hold the compact icon-only pill on screen this long before expanding to
// reveal the text.
const EXPAND_DELAY_MS = 400;

// The compact pill rests at this scale and grows to 1 as it expands, giving a
// subtle vertical (and overall) swell without cutting the actual height.
const COMPACT_SCALE = 0.9;

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

// A subtitle is either a plain text line, or a directional pair rendered with
// an animated arrow between the two sides.
type Subtitle =
  | { type: 'text'; text: string }
  | { type: 'directional'; from: string; to: string };

function getSubtitle(
  view: ToasterView | undefined,
  terminal: TerminalKind | null
): Subtitle | null {
  if (!view) return null;
  if (terminal === 'success' && view.kind === 'bridge') {
    return { type: 'text', text: 'may take a few minutes' };
  }
  if (view.kind === 'approve') {
    return { type: 'text', text: view.token.symbol };
  }
  if (view.kind === 'send') {
    const target =
      view.recipient.name ?? truncateAddress(view.recipient.address, 4);
    return { type: 'directional', from: view.token.symbol, to: target };
  }
  return {
    type: 'directional',
    from: view.sent.symbol,
    to: view.received.symbol,
  };
}

// A stable key for AnimatePresence so the subtitle re-animates on content
// change but the arrow keeps marching across a from/to swap.
function getSubtitleKey(subtitle: Subtitle): string {
  return subtitle.type === 'text'
    ? subtitle.text
    : `${subtitle.from}→${subtitle.to}`;
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

// The text column (title + subtitle) and the queue counter, extracted so the
// whole block can be revealed/hidden as one unit during the entrance phases.
function ToasterText({
  title,
  subtitle,
  terminal,
  reducedMotion,
  pendingQueueCount,
}: {
  title: string;
  subtitle: Subtitle | null;
  terminal: TerminalKind | null;
  reducedMotion: boolean;
  pendingQueueCount: number;
}) {
  return (
    <>
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
          </motion.span>
        </AnimatePresence>
        <AnimatePresence mode="popLayout" initial={false}>
          {subtitle ? (
            <motion.span
              key={getSubtitleKey(subtitle)}
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
              {subtitle.type === 'directional' ? (
                <>
                  <span className={s.subtitleSide} title={subtitle.from}>
                    {subtitle.from}
                  </span>
                  <ToasterArrow
                    terminal={terminal}
                    reducedMotion={reducedMotion}
                  />
                  <span className={s.subtitleSide} title={subtitle.to}>
                    {subtitle.to}
                  </span>
                </>
              ) : (
                subtitle.text
              )}
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
    </>
  );
}

function ToasterContent({
  step,
  terminal,
  reducedMotion,
  pendingQueueCount,
  textRevealed,
}: {
  step: ActiveStepView | null;
  terminal: TerminalKind | null;
  reducedMotion: boolean;
  pendingQueueCount: number;
  // During the first entrance phase the pill shows only the icon; the text
  // column and counter reveal once this flips true.
  textRevealed: boolean;
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
      {/* Always mounted so .measureWrap reports the full content width from the
          first frame (the pill clips it behind COMPACT_WIDTH while hidden). The
          reveal is purely a fade + scale-down driven by textRevealed. */}
      <motion.div
        className={s.textReveal}
        initial={false}
        animate={
          textRevealed
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
                opacity: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
              }
        }
      >
        <ToasterText
          title={title}
          subtitle={subtitle}
          terminal={terminal}
          reducedMotion={reducedMotion}
          pendingQueueCount={pendingQueueCount}
        />
      </motion.div>
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
  // Two-phase entrance: the pill first appears compact (icon only), then
  // expands to reveal the text. 'compact' on mount, flips to 'expanded' once
  // the initial fade/scale-in settles.
  const [entrancePhase, setEntrancePhase] = useState<'compact' | 'expanded'>(
    'compact'
  );
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const justDraggedRef = useRef(false);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Clear the pending expand-hold timer if the whole toaster unmounts.
  useEffect(
    () => () => {
      if (expandTimerRef.current != null) {
        clearTimeout(expandTimerRef.current);
      }
    },
    []
  );

  // The parent component stays mounted across toaster sessions; only the
  // inner motion.button mounts/unmounts via AnimatePresence. Reset pill-local
  // state AFTER the exit animation completes (via AnimatePresence's
  // onExitComplete) so the next entrance starts from a clean slate — no
  // leftover drag offset, entrance gate re-armed, default exit direction.
  // Resetting earlier would interrupt the exit animation in flight.
  const handleExitComplete = useCallback(() => {
    if (expandTimerRef.current != null) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    dragX.set(0);
    dragY.set(0);
    setHasEntered(false);
    setEntrancePhase('compact');
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

  // Reduced motion skips the staged reveal: show the full pill at once.
  const expanded = entrancePhase === 'expanded' || reducedMotion;
  const targetWidth = expanded ? contentWidth + 48 || 'auto' : COMPACT_WIDTH;
  // Compact pill rests scaled down; it grows to full scale as it expands.
  const targetScale = expanded ? 1 : COMPACT_SCALE;

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
                ? { opacity: 0, width: targetWidth }
                : { opacity: 0, scale: 0.8, width: COMPACT_WIDTH }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: targetScale,
              width: targetWidth,
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
                    opacity: { duration: 0.2, ease: SLIDE_EASE },
                    // Clean settle for the compact appear (0.8 → 0.9), bouncy
                    // spring only for the expand swell (0.9 → 1).
                    scale: expanded
                      ? SCALE_SPRING
                      : { duration: 0.26, ease: SLIDE_EASE },
                    width: EXPAND_SPRING,
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
            onAnimationComplete={() => {
              // The animate target carries opacity/scale/width together, so a
              // single completion event covers the phase we're in. After the
              // compact fade/scale-in settles, hold briefly, then expand to
              // reveal the text; after the expansion settles, arm drag/hover.
              if (!expanded) {
                if (expandTimerRef.current == null) {
                  expandTimerRef.current = setTimeout(() => {
                    expandTimerRef.current = null;
                    setEntrancePhase('expanded');
                  }, EXPAND_DELAY_MS);
                }
              } else if (!hasEntered) {
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
                textRevealed={expanded}
              />
            </div>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
