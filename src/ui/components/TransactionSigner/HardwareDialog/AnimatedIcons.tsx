import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import ArrowRightImg from 'jsx:src/ui/assets/arrow-right.svg';
import { useReducedMotion } from '../Toaster/useReducedMotion';
import * as s from './AnimatedIcons.module.css';

type Phase = 'start' | 'transitioning' | 'complete' | 'failed';

export type AnimatedIconsSize = 'big' | 'small';

interface AnimatedIconsProps {
  startItem: React.ReactNode;
  endItem: React.ReactNode | null;
  phase: Phase;
  size?: AnimatedIconsSize;
}

function StatusBadge({
  kind,
  size,
  reducedMotion,
}: {
  kind: 'complete' | 'failed';
  size: number;
  reducedMotion: boolean;
}) {
  const isSuccess = kind === 'complete';
  return (
    <div
      className={`${s.statusBadge} ${
        isSuccess ? s.statusBadgeSuccess : s.statusBadgeFailed
      }`}
      style={{ width: size, height: size }}
    >
      <motion.svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        {isSuccess ? (
          <motion.path
            d="M3 8.7l3 3 7.5-7.5"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.1 }
                : { duration: 0.3, ease: [0.32, 0.72, 0, 1], delay: 0.25 }
            }
          />
        ) : (
          <>
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
                  : { duration: 0.22, ease: [0.32, 0.72, 0, 1], delay: 0.25 }
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
                  : { duration: 0.22, ease: [0.32, 0.72, 0, 1], delay: 0.4 }
              }
            />
          </>
        )}
      </motion.svg>
    </div>
  );
}

/**
 * Custom easing that matches the extension's pending animation:
 * fast initial movement then slow drift
 */
function createEaseFunction() {
  const xBreak = 0.08;
  const yBreak = 0.5;
  const slopeStart = yBreak / xBreak;
  const slopeEnd = (1 - yBreak) / (1 - xBreak);
  return (t: number) => {
    if (t < xBreak) {
      return slopeStart * t;
    }
    return yBreak + slopeEnd * (t - xBreak);
  };
}

const easeFunction = createEaseFunction();

function useDriftAnimation(targetX: number, phase: Phase) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === 'start') {
      animate(scope.current, { x: 0 }, { duration: 0 });
      return;
    }

    if (phase === 'transitioning') {
      animate(
        scope.current,
        { x: targetX },
        {
          duration: 5,
          ease: easeFunction,
        }
      );
      return;
    }

    if (phase === 'complete' || phase === 'failed') {
      if (prevPhase === 'transitioning') {
        animate(
          scope.current,
          { x: 0 },
          {
            duration: 0.25,
            ease: [0.39, 0.575, 0.565, 1],
          }
        );
      }
    }
  }, [phase, targetX, animate, scope]);

  return scope;
}

export function AnimatedIcons({
  startItem,
  endItem,
  phase,
  size = 'big',
}: AnimatedIconsProps) {
  const showBothIcons = endItem != null;
  const playExitAnimation = phase === 'complete' || phase === 'failed';
  const reducedMotion = useReducedMotion();

  const driftDistance = size === 'big' ? 150 : 80;
  const startRef = useDriftAnimation(-driftDistance, phase);
  const endRef = useDriftAnimation(driftDistance, phase);

  const iconSize = size === 'big' ? 72 : 56;

  if (!showBothIcons) {
    return (
      <div className={s.container}>
        <motion.div
          className={s.singleIcon}
          animate={{
            opacity: playExitAnimation ? 0 : 1,
            filter: playExitAnimation ? 'blur(8px)' : 'blur(0px)',
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {startItem}
        </motion.div>
        <AnimatePresence>
          {playExitAnimation ? (
            <motion.div
              className={s.resultIcon}
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
            >
              <StatusBadge
                kind={phase === 'complete' ? 'complete' : 'failed'}
                size={iconSize}
                reducedMotion={reducedMotion}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <motion.div
        className={s.itemsRow}
        animate={{
          opacity: playExitAnimation ? 0 : 1,
          filter: playExitAnimation ? 'blur(8px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div ref={startRef} className={s.iconItem}>
          {startItem}
        </div>
        {!playExitAnimation ? (
          <ArrowRightImg className={s.arrowIcon} width={24} height={24} />
        ) : null}
        <div ref={endRef} className={s.iconItem}>
          {endItem}
        </div>
      </motion.div>
      <AnimatePresence>
        {playExitAnimation ? (
          <motion.div
            className={s.resultIcon}
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
          >
            <StatusBadge
              kind={phase === 'complete' ? 'complete' : 'failed'}
              size={72}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
