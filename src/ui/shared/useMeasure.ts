import React, { useEffect, useRef, useState } from 'react';

interface Measurements {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  x: number;
  y: number;
}

const INITIAL: Measurements = {
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  x: 0,
  y: 0,
};

export function useMeasure<T extends HTMLElement>(): [
  React.RefCallback<T>,
  Measurements
] {
  const [measurements, setMeasurements] = useState<Measurements>(INITIAL);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = React.useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    if (node) {
      const observer = new ResizeObserver(([entry]) => {
        const rect = entry.contentRect;
        const next: Measurements = {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          x: rect.x,
          y: rect.y,
        };
        setMeasurements((prev) =>
          prev.width === next.width &&
          prev.height === next.height &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.right === next.right &&
          prev.bottom === next.bottom &&
          prev.x === next.x &&
          prev.y === next.y
            ? prev
            : next
        );
      });
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return [ref, measurements];
}
