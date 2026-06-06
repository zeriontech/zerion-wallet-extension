import React, { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import ArrowRightImg from 'jsx:src/ui/assets/arrow-right.svg';
import type { TerminalKind } from './useToasterSession';
import * as s from './styles.module.css';

// Geometry of the clipping slot (.arrowSlot) and glyph (.arrowGlyph) in px.
const SLOT_WIDTH = 22;
const GLYPH_WIDTH = 14;
// A full sweep carries the glyph's left edge from fully off-screen-left to
// fully off-screen-right, so it disappears behind both gap borders.
const SWEEP_START_X = -GLYPH_WIDTH;
const SWEEP_END_X = SLOT_WIDTH;
const SWEEP_DISTANCE = SWEEP_END_X - SWEEP_START_X;
// Resting position: glyph horizontally centered in the slot.
const CENTER_X = (SLOT_WIDTH - GLYPH_WIDTH) / 2;

const CYCLE_DURATION = 1.5;
// Two arrows chase each other half a cycle apart for a continuous feel.
const PHASE_OFFSET = 0.5;
const SETTLE_DURATION = 0.32;
const SETTLE_EASE = [0.32, 0.72, 0, 1] as const;
// Subtle breathing scale: smallest at the gap edges, full size mid-sweep.
const SCALE_MIN = 0.7;
const SCALE_MAX = 1;

// Map a phase-shifted, wrapped progress value to the glyph's translateX.
function phaseToX(progress: number, offset: number): number {
  const wrapped = (progress + offset) % 1;
  return SWEEP_START_X + wrapped * SWEEP_DISTANCE;
}

// Scale follows position: SCALE_MIN at the start (wrapped 0) and end
// (wrapped 1) of the sweep, SCALE_MAX at the middle (wrapped 0.5).
function phaseToScale(progress: number, offset: number): number {
  const wrapped = (progress + offset) % 1;
  const center = 1 - Math.abs(wrapped - 0.5) * 2;
  return SCALE_MIN + (SCALE_MAX - SCALE_MIN) * center;
}

export function ToasterArrow({
  terminal,
  reducedMotion,
}: {
  terminal: TerminalKind | null;
  reducedMotion: boolean;
}) {
  // Marching progress, looped 0 → 1 while pending.
  const progress = useMotionValue(0);
  // The lead arrow's x/scale are driven directly so they can settle on
  // terminal; the trailing arrow always mirrors `progress` with an offset.
  const leadX = useMotionValue(phaseToX(0, 0));
  const leadScale = useMotionValue(phaseToScale(0, 0));
  const trailX = useTransform(progress, (p) => phaseToX(p, PHASE_OFFSET));
  const trailScale = useTransform(progress, (p) =>
    phaseToScale(p, PHASE_OFFSET)
  );
  // Trailing arrow fades out once we settle, leaving a single centered arrow.
  const trailOpacity = useMotionValue(1);

  const terminalRef = useRef<TerminalKind | null>(null);

  // Loop while pending: keep leadX synced to progress, restart the sweep.
  useEffect(() => {
    if (terminal !== null || reducedMotion) return;
    terminalRef.current = null;
    progress.set(0);
    trailOpacity.set(1);
    const unsubscribe = progress.on('change', (p) => {
      leadX.set(phaseToX(p, 0));
      leadScale.set(phaseToScale(p, 0));
    });
    const controls = animate(progress, 1, {
      duration: CYCLE_DURATION,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [terminal, reducedMotion, progress, leadX, leadScale, trailOpacity]);

  // Terminal: finish the march and rest a single arrow in the center.
  useEffect(() => {
    if (terminal === null) return;
    if (terminalRef.current === terminal) return;
    terminalRef.current = terminal;

    if (reducedMotion) {
      leadX.set(CENTER_X);
      leadScale.set(SCALE_MAX);
      trailOpacity.set(0);
      return;
    }

    // Ease the lead arrow from wherever it is to the center at full size,
    // hiding the trailing arrow so only one arrow remains, static.
    const leadXControls = animate(leadX, CENTER_X, {
      duration: SETTLE_DURATION,
      ease: SETTLE_EASE,
    });
    const leadScaleControls = animate(leadScale, SCALE_MAX, {
      duration: SETTLE_DURATION,
      ease: SETTLE_EASE,
    });
    const trailControls = animate(trailOpacity, 0, {
      duration: SETTLE_DURATION * 0.6,
      ease: 'easeOut',
    });
    return () => {
      leadXControls.stop();
      leadScaleControls.stop();
      trailControls.stop();
    };
  }, [terminal, reducedMotion, leadX, leadScale, trailOpacity]);

  return (
    <span className={s.arrowSlot} aria-hidden="true">
      <motion.span
        className={s.arrowGlyph}
        style={{ x: trailX, scale: trailScale, opacity: trailOpacity }}
      >
        <ArrowRightImg width={14} height={14} />
      </motion.span>
      <motion.span
        className={s.arrowGlyph}
        style={{ x: leadX, scale: leadScale }}
      >
        <ArrowRightImg width={14} height={14} />
      </motion.span>
    </span>
  );
}
