import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LogoUrl from 'url:src/ui/assets/zerion-logo-gradient.svg';
import styles from './styles.module.css';

const PER_CANNON = 14;
/** How long a tap stays "counted" before the streak starts over. */
const TAP_WINDOW = 600;

interface Piece {
  id: number;
  fromLeft: boolean;
  /** Inline CSS custom properties consumed by styles.module.css. */
  style: React.CSSProperties;
  /** When this piece is done flying, in ms from the burst. */
  endsAt: number;
}

function createPieces(): Piece[] {
  return Array.from({ length: PER_CANNON * 2 }, (_, id) => {
    const fromLeft = id < PER_CANNON;
    // Launch angle and power together, so shallow shots fly far and low while
    // steep ones go high and land close — a fan rather than a random scatter.
    const angle = ((22 + Math.random() * 56) * Math.PI) / 180;
    const power = 0.75 + Math.random() * 0.45;
    const duration = 1800 + Math.random() * 500;
    const delay = Math.random() * 140;

    return {
      id,
      fromLeft,
      endsAt: duration + delay,
      style: {
        [fromLeft ? 'left' : 'right']: 20,
        '--tx': `${Math.cos(angle) * 160 * power * (fromLeft ? 1 : -1)}vw`,
        '--peak': `${-Math.sin(angle) * 72 * power}vh`,
        '--spin': `${
          (240 + Math.random() * 720) * (Math.random() < 0.5 ? -1 : 1)
        }deg`,
        '--size': `${12 + Math.random() * 14}px`,
        '--dur': `${duration}ms`,
        '--delay': `${delay}ms`,
      } as React.CSSProperties,
    };
  });
}

/**
 * Counts taps that land within {@link TAP_WINDOW} of each other and calls
 * `onUnlock` once the streak reaches `target`.
 */
export function useTapStreak(target: number, onUnlock: () => void) {
  const streak = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const unlock = useRef(onUnlock);
  unlock.current = onUnlock;

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(() => {
    clearTimeout(timer.current);
    streak.current += 1;
    if (streak.current >= target) {
      streak.current = 0;
      unlock.current();
    } else {
      timer.current = setTimeout(() => (streak.current = 0), TAP_WINDOW);
    }
  }, [target]);
}

/**
 * Fires Zerion logos out of both bottom corners, then calls `onDone` so the
 * caller can unmount it. Portalled to the body: a `position: fixed` layer would
 * otherwise be trapped by any transformed ancestor and miss the real corners.
 */
export function Confetti({ onDone }: { onDone: () => void }) {
  const [pieces] = useState(createPieces);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const last = Math.max(...pieces.map((piece) => piece.endsAt));
    const timer = setTimeout(() => done.current(), last);
    return () => clearTimeout(timer);
  }, [pieces]);

  return createPortal(
    <div className={styles.layer} aria-hidden={true}>
      {pieces.map((piece) => (
        <span key={piece.id} className={styles.piece} style={piece.style}>
          <img className={styles.body} src={LogoUrl} alt="" draggable={false} />
        </span>
      ))}
    </div>,
    document.body
  );
}
