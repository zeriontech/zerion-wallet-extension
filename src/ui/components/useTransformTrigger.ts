import { useState, useCallback, useEffect } from 'react';
import { useSpring } from 'react-spring';

export function useTransformTrigger({
  x = 0,
  y = 0,
  rotation = 0,
  scale = 1,
  timing = 150,
  springConfig = {
    tension: 300,
    friction: 10,
  },
  delay = 0,
}) {
  const [on, set] = useState(false);

  const style = useSpring({
    backfaceVisibility: 'hidden',
    transform: on
      ? `translate(${x}px, ${y}px)
         rotate(${rotation}deg)
         scale(${scale})`
      : `translate(0px, 0px)
         rotate(0deg)
         scale(1)`,
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
