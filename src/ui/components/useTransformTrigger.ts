import type { CSSProperties } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useSpring } from '@react-spring/web';

export function useTransformTrigger({
  x = 0,
  y = 0,
  rotation = 0,
  scale = 1,
  scaleX = 1,
  timing = 150,
  springConfig = {
    tension: 300,
    friction: 10,
  },
  delay = 0,
  display,
}: {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  scaleX?: number;
  timing?: number;
  springConfig?: {
    tension: number;
    friction: number;
  };
  delay?: number;
  display?: CSSProperties['display'];
}) {
  const [on, set] = useState(false);

  const style = useSpring({
    display,
    backfaceVisibility: 'hidden',
    transform: on
      ? `translate(${x}px, ${y}px)
         rotate(${rotation}deg)
         scale(${scale})
         scaleX(${scaleX})`
      : `translate(0px, 0px)
         rotate(0deg)
         scale(1)
         scaleX(1)`,
    config: springConfig,
    delay,
  } as const);

  useEffect(() => {
    if (!on) {
      return;
    }
    const timeoutId = setTimeout(() => set(false), timing);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [on, timing]);

  const trigger = useCallback(() => set(true), []);

  return { style, trigger };
}
