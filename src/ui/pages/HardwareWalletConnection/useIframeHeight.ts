import { useLayoutEffect, useRef, useState } from 'react';

export function useIframeHeight() {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!fillRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { height } = entry.contentRect;
      setHeight(height);
    });
    const element = fillRef.current;
    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  }, []);

  return { height, ref: fillRef };
}
