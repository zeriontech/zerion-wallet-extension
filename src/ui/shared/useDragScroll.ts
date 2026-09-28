import { useCallback, useEffect, useRef } from 'react';

/**
 * Click-and-drag horizontal scrolling for a mouse. Touch is left alone so the
 * browser's native momentum scrolling keeps working on the overflow container.
 * A small movement threshold distinguishes a drag from a click, and a captured
 * click after a real drag is swallowed so releasing over a child doesn't
 * activate it. Spread the returned props onto the scrollable container.
 *
 * The drag is tracked with document-level listeners rather than the
 * container's own pointermove/pointerup: a fast flick can leave the container
 * (or the dialog it sits in) before the first pointermove is delivered, so
 * pointer capture never engages and a release outside would never end the
 * drag — the row would keep following an unpressed cursor.
 *
 * Ported from zerion-web-app `src/utils/useDragScroll.ts`.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const moved = useRef(false);
  const teardown = useRef<(() => void) | null>(null);

  useEffect(() => () => teardown.current?.(), []);

  const onPointerDown = useCallback((event: React.PointerEvent<T>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    teardown.current?.();
    moved.current = false;
    const { pointerId } = event;
    const startX = event.clientX;
    const startScroll = el.scrollLeft;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      // A release that happened outside the window (or was otherwise
      // swallowed) never fires pointerup; the first hover move reveals it.
      if (e.buttons === 0) {
        teardown.current?.();
        return;
      }
      const dx = e.clientX - startX;
      if (!moved.current && Math.abs(dx) > 3) {
        moved.current = true;
        el.setPointerCapture(pointerId);
      }
      if (moved.current) {
        el.scrollLeft = startScroll - dx;
      }
    };
    const end = () => {
      teardown.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', end);
      if (el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
    };
    teardown.current = end;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
  }, []);

  const onClickCapture = useCallback((event: React.MouseEvent<T>) => {
    if (moved.current) {
      event.preventDefault();
      event.stopPropagation();
      moved.current = false;
    }
  }, []);

  // Suppress the browser's native image ghost-drag so dragging a child's icon
  // scrolls the row instead of picking up the image. `dragstart` bubbles, so
  // one handler on the container covers every child.
  const onDragStart = useCallback((event: React.DragEvent<T>) => {
    event.preventDefault();
  }, []);

  return { ref, onPointerDown, onClickCapture, onDragStart };
}
