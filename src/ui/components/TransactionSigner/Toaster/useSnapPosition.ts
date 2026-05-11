import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SnapPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export function isTop(p: SnapPosition): boolean {
  return p.startsWith('top-');
}

export function isLeft(p: SnapPosition): boolean {
  return p.endsWith('-left');
}

export function isRight(p: SnapPosition): boolean {
  return p.endsWith('-right');
}

export function isCenter(p: SnapPosition): boolean {
  return p.endsWith('-center');
}

interface ViewportSize {
  width: number;
  height: number;
}

function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export const SNAP_MARGIN = 16;

/**
 * CSS edge anchors. Always emits all four edge properties (using `auto` to
 * unset) so the browser cleanly switches between anchor modes when position
 * changes. The `translate` CSS property handles centering without conflicting
 * with motion's `transform` (drag x/y).
 */
export function getAnchorStyle(position: SnapPosition): CSSProperties {
  const top = isTop(position) ? SNAP_MARGIN : 'auto';
  const bottom = !isTop(position) ? SNAP_MARGIN : 'auto';
  let left: number | string = 'auto';
  let right: number | string = 'auto';
  let translate = 'none';
  if (isLeft(position)) {
    left = SNAP_MARGIN;
  } else if (isRight(position)) {
    right = SNAP_MARGIN;
  } else {
    left = '50%';
    translate = '-50% 0';
  }
  return { top, bottom, left, right, translate };
}

function quadrantFor(
  centerX: number,
  centerY: number,
  viewport: ViewportSize
): SnapPosition {
  const { width, height } = viewport;
  const col = centerX < width / 3 ? 0 : centerX < (width * 2) / 3 ? 1 : 2;
  const row = centerY < height / 2 ? 0 : 1;
  if (row === 0) {
    return col === 0 ? 'top-left' : col === 1 ? 'top-center' : 'top-right';
  }
  return col === 0
    ? 'bottom-left'
    : col === 1
    ? 'bottom-center'
    : 'bottom-right';
}

export function useSnapPosition({
  pillRef,
  initial = 'top-center',
}: {
  pillRef: React.RefObject<HTMLElement | null>;
  initial?: SnapPosition;
}) {
  const viewport = useViewportSize();
  const [position, setPosition] = useState<SnapPosition>(initial);
  const positionRef = useRef(position);
  positionRef.current = position;

  const computeNextPosition = useCallback((): SnapPosition | null => {
    const el = pillRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return quadrantFor(cx, cy, viewport);
  }, [pillRef, viewport]);

  return { position, setPosition, viewport, computeNextPosition };
}
