import { useCallback, useEffect, useState } from 'react';

export function useHoverAnimation(timing: number) {
  const [isBooped, setIsBooped] = useState(false);

  useEffect(() => {
    if (!isBooped) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsBooped(false);
    }, timing);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isBooped, timing]);

  return {
    isBooped,
    handleMouseEnter: useCallback(() => setIsBooped(true), []),
  };
}
