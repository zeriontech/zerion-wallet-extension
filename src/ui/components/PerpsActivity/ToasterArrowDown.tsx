import React, { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import ArrowDownImg from 'jsx:src/ui/assets/arrow-down.svg';
import type { PerpsActivityTerminal } from 'src/modules/hyperliquid/perpsActivityStore';
import * as s from './styles.module.css';

// Vertical sibling of TransactionSigner/Toaster/ToasterArrow: same marching feel
// (two glyphs chasing each other, settle to a single centered arrow on
// terminal) but oriented downward and sweeping top → bottom. Used for the
// withdraw flow, where funds move "down" off the perps account.

// Geometry of the clipping slot (.arrowSlotDown) and glyph in px. SLOT_HEIGHT
// must match the .arrowSlotDown height in styles.module.css. The glyph is
// icon-sized (28px); the slot is taller so the arrow has room to march.
const SLOT_HEIGHT = 40;
const GLYPH_HEIGHT = 28;
// A full sweep carries the glyph's top edge from fully off-screen-top to fully
// off-screen-bottom, so it disappears behind both gap borders.
const SWEEP_START_Y = -GLYPH_HEIGHT;
const SWEEP_END_Y = SLOT_HEIGHT;
const SWEEP_DISTANCE = SWEEP_END_Y - SWEEP_START_Y;
// Resting position: glyph vertically centered in the slot.
const CENTER_Y = (SLOT_HEIGHT - GLYPH_HEIGHT) / 2;

const CYCLE_DURATION = 1.5;
// Two arrows chase each other half a cycle apart for a continuous feel.
const PHASE_OFFSET = 0.5;
const SETTLE_DURATION = 0.32;
const SETTLE_EASE = [0.32, 0.72, 0, 1] as const;
// Subtle breathing scale: smallest at the gap edges, full size mid-sweep.
const SCALE_MIN = 0.7;
const SCALE_MAX = 1;

// Map a phase-shifted, wrapped progress value to the glyph's translateY.
function phaseToY(progress: number, offset: number): number {
  const wrapped = (progress + offset) % 1;
  return SWEEP_START_Y + wrapped * SWEEP_DISTANCE;
}

// Scale follows position: SCALE_MIN at the start (wrapped 0) and end (wrapped 1)
// of the sweep, SCALE_MAX at the middle (wrapped 0.5).
function phaseToScale(progress: number, offset: number): number {
  const wrapped = (progress + offset) % 1;
  const center = 1 - Math.abs(wrapped - 0.5) * 2;
  return SCALE_MIN + (SCALE_MAX - SCALE_MIN) * center;
}

export function ToasterArrowDown({
  terminal,
  reducedMotion,
}: {
  terminal: PerpsActivityTerminal['state'] | null;
  reducedMotion: boolean;
}) {
  // Marching progress, looped 0 → 1 while pending.
  const progress = useMotionValue(0);
  // The lead arrow's y/scale are driven directly so they can settle on
  // terminal; the trailing arrow always mirrors `progress` with an offset.
  const leadY = useMotionValue(phaseToY(0, 0));
  const leadScale = useMotionValue(phaseToScale(0, 0));
  const trailY = useTransform(progress, (p) => phaseToY(p, PHASE_OFFSET));
  const trailScale = useTransform(progress, (p) =>
    phaseToScale(p, PHASE_OFFSET)
  );
  // Trailing arrow fades out once we settle, leaving a single centered arrow.
  const trailOpacity = useMotionValue(1);

  const isPending = terminal === null || terminal === 'running';
  const terminalRef = useRef<PerpsActivityTerminal['state'] | null>(null);

  // Loop while pending: keep leadY synced to progress, restart the sweep.
  useEffect(() => {
    if (!isPending || reducedMotion) return;
    terminalRef.current = null;
    progress.set(0);
    trailOpacity.set(1);
    const unsubscribe = progress.on('change', (p) => {
      leadY.set(phaseToY(p, 0));
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
  }, [isPending, reducedMotion, progress, leadY, leadScale, trailOpacity]);

  // Terminal: finish the march and rest a single arrow in the center.
  useEffect(() => {
    if (isPending || terminal === null) return;
    if (terminalRef.current === terminal) return;
    terminalRef.current = terminal;

    if (reducedMotion) {
      leadY.set(CENTER_Y);
      leadScale.set(SCALE_MAX);
      trailOpacity.set(0);
      return;
    }

    // Ease the lead arrow from wherever it is to the center at full size,
    // hiding the trailing arrow so only one arrow remains, static.
    const leadYControls = animate(leadY, CENTER_Y, {
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
      leadYControls.stop();
      leadScaleControls.stop();
      trailControls.stop();
    };
  }, [isPending, terminal, reducedMotion, leadY, leadScale, trailOpacity]);

  return (
    <span className={s.arrowSlotDown} aria-hidden="true">
      <motion.span
        className={s.arrowGlyphDown}
        style={{ y: trailY, scale: trailScale, opacity: trailOpacity }}
      >
        <ArrowDownImg width={28} height={28} />
      </motion.span>
      <motion.span
        className={s.arrowGlyphDown}
        style={{ y: leadY, scale: leadScale }}
      >
        <ArrowDownImg width={28} height={28} />
      </motion.span>
    </span>
  );
}
