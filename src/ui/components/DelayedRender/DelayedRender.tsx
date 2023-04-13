import type React from 'react';
import { useEffect, useState } from 'react';

export function useRenderDelay(delay: number) {
  const [render, setRender] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => setRender(true), delay);
    return () => {
      clearTimeout(timerId);
    };
  }, [delay]);
  return render;
}

export function DelayedRender({
  children,
  delay = 500,
}: React.PropsWithChildren<{ delay?: number }>) {
  const render = useRenderDelay(delay);

  if (render) {
    return children as JSX.Element;
  } else {
    return null;
  }
}
