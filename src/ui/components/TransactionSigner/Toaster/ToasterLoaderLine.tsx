import React, { useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
} from 'motion/react';
import { Button } from 'src/ui/ui-kit/Button';
import { HStack } from 'src/ui/ui-kit/HStack';
import { UIText } from 'src/ui/ui-kit/UIText';
import { VStack } from 'src/ui/ui-kit/VStack';
import { registerPreviewPermanent } from 'src/ui-lab/previews/registerPreview';
import type { TerminalKind } from './useToasterSession';
import * as s from './styles.module.css';

const SWEEP_DURATION = 1;
const BLOB_WIDTH_PCT = 70;
// Sweep ranges from -1 (blob's right edge at container left) to +1 (blob's
// left edge at container right). `progress` is the normalized parameter we
// drive with motion, then map to left/right percentages.

const STRETCH_DURATION = 0.3;
const STRETCH_EASE = [0.32, 0.72, 0, 1] as const;
const HOLD_BEFORE_FADE_MS = 350;
const FADE_OUT_DURATION = 0.3;

const ENTER_FADE_DURATION = 0.2;
const ENTER_FADE_DELAY = 0.15;

// Map progress [0, 1] to blob left%. The blob's left edge sweeps between
// SWEEP_MIN_LEFT_PCT (left-most) and SWEEP_MAX_LEFT_PCT (right-most). Range
// is narrower than [-BLOB_WIDTH_PCT, 100] so the blob's bright center never
// drifts fully off-screen.
const SWEEP_MIN_LEFT_PCT = -30;
const SWEEP_MAX_LEFT_PCT = 100 - BLOB_WIDTH_PCT + 30;
function progressToLeftPct(p: number): number {
  return SWEEP_MIN_LEFT_PCT + p * (SWEEP_MAX_LEFT_PCT - SWEEP_MIN_LEFT_PCT);
}

export function ToasterLoaderLine({
  terminal,
}: {
  terminal: TerminalKind | null;
}) {
  const progress = useMotionValue(0);
  const blobLeft = useTransform(progress, (p) => `${progressToLeftPct(p)}%`);
  const blobRight = useTransform(
    progress,
    (p) => `${100 - progressToLeftPct(p) - BLOB_WIDTH_PCT}%`
  );
  // Opacity peaks at the center of the sweep (p = 0.5) and dips at edges.
  const blobOpacity = useTransform(
    progress,
    (p) => 1 - 0.3 * Math.abs(p - 0.5) * 2
  );

  const stretchControls = useAnimationControls();
  const solidControls = useAnimationControls();

  const [solidColor, setSolidColor] = useState<string | null>(null);
  const terminalRef = useRef<TerminalKind | null>(null);

  // Sweep loop while in progress.
  useEffect(() => {
    if (terminal !== null) return;
    progress.set(0);
    const controls = animate(progress, 1, {
      duration: SWEEP_DURATION,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'mirror',
    });
    return () => {
      controls.stop();
    };
  }, [terminal, progress]);

  // Terminal flip: capture position, stretch + recolor + hold + fade.
  useEffect(() => {
    if (terminal === null) {
      terminalRef.current = null;
      return;
    }
    if (terminalRef.current === terminal) return;
    terminalRef.current = terminal;

    const p = progress.get();
    const leftPct = progressToLeftPct(p);
    const rightPct = 100 - leftPct - BLOB_WIDTH_PCT;

    stretchControls.set({
      left: `${leftPct}%`,
      right: `${rightPct}%`,
      opacity: 1,
    });
    solidControls.set({
      left: `${leftPct}%`,
      right: `${rightPct}%`,
      opacity: 0,
    });

    setSolidColor(
      terminal === 'success'
        ? 'var(--positive-300, #99dbb4)'
        : 'var(--negative-300, #ffd0c9)'
    );

    let cancelled = false;
    void (async () => {
      await Promise.all([
        stretchControls.start({
          left: '-50%',
          right: '-50%',
          opacity: 0,
          transition: { duration: STRETCH_DURATION, ease: STRETCH_EASE },
        }),
        solidControls.start({
          left: '-50%',
          right: '-50%',
          opacity: 1,
          transition: { duration: STRETCH_DURATION, ease: STRETCH_EASE },
        }),
      ]);
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, HOLD_BEFORE_FADE_MS));
      if (cancelled) return;
      await solidControls.start({
        opacity: 0,
        transition: { duration: FADE_OUT_DURATION },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [terminal, progress, stretchControls, solidControls]);

  return (
    <motion.div
      className={s.loaderLine}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: ENTER_FADE_DURATION,
        delay: ENTER_FADE_DELAY,
      }}
    >
      {terminal === null ? (
        <motion.div
          className={s.loaderBlob}
          style={{ left: blobLeft, right: blobRight, opacity: blobOpacity }}
        />
      ) : (
        <>
          <motion.div className={s.loaderStretch} animate={stretchControls} />
          <motion.div
            className={s.loaderSolid}
            style={
              {
                ['--solid-color' as string]: solidColor ?? 'transparent',
              } as React.CSSProperties
            }
            animate={solidControls}
          />
        </>
      )}
    </motion.div>
  );
}

function ToasterLoaderLinePreview() {
  const [terminal, setTerminal] = useState<TerminalKind | null>(null);
  const [nonce, setNonce] = useState(0);
  const flip = (next: TerminalKind | null) => {
    setTerminal(null);
    setNonce((n) => n + 1);
    if (next !== null) {
      setTimeout(() => setTerminal(next), 0);
    }
  };
  return (
    <VStack gap={16}>
      <HStack gap={8}>
        <Button
          kind={terminal === null ? 'primary' : 'regular'}
          size={32}
          onClick={() => flip(null)}
        >
          Loading
        </Button>
        <Button
          kind={terminal === 'success' ? 'primary' : 'regular'}
          size={32}
          onClick={() => flip('success')}
        >
          Success
        </Button>
        <Button
          kind={terminal === 'failed' ? 'primary' : 'regular'}
          size={32}
          onClick={() => flip('failed')}
        >
          Failed
        </Button>
      </HStack>
      <UIText kind="caption/regular" color="var(--neutral-500)">
        Container is 320×40 with relative positioning so the absolutely-
        positioned line renders at the top edge.
      </UIText>
      <div
        key={nonce}
        style={{
          position: 'relative',
          width: 320,
          height: 40,
          background: 'var(--white)',
          borderRadius: 8,
          border: '1px solid var(--neutral-200)',
          overflow: 'hidden',
        }}
      >
        <ToasterLoaderLine terminal={terminal} />
      </div>
    </VStack>
  );
}

registerPreviewPermanent({
  name: 'ToasterLoaderLine',
  component: () => <ToasterLoaderLinePreview />,
});
