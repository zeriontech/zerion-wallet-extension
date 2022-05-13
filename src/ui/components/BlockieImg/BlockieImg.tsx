import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { createIcon } from '@download/blockies';

export function BlockieImg({
  address,
  size,
}: {
  address: string;
  size: number;
}) {
  const blocksCount = 8;
  const icon = useMemo(
    () =>
      createIcon({
        seed: address,
        size: blocksCount,
        scale: (size / blocksCount) * window.devicePixelRatio,
      }),
    [address, size]
  );
  const ref = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    if (ref.current && icon) {
      icon.style.borderRadius = '6px';
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      ref.current.appendChild(icon);
    }
    return () => {
      icon.parentElement?.removeChild(icon);
    };
  }, [icon, size]);
  return <span ref={ref} style={{ width: size, height: size }} />;
}
