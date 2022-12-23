import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { createIcon } from '@download/blockies';
import { normalizeAddress } from 'src/shared/normalizeAddress';

export function BlockieImg({
  address,
  size,
  borderRadius,
}: {
  address: string;
  size: number;
  borderRadius: string;
}) {
  const blocksCount = 8;
  const icon = useMemo(
    () =>
      createIcon({
        seed: normalizeAddress(address),
        size: blocksCount,
        scale: (size / blocksCount) * window.devicePixelRatio,
      }),
    [address, size]
  );
  const ref = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    if (ref.current && icon) {
      icon.style.borderRadius = borderRadius;
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      icon.style.display = 'block';
      ref.current.appendChild(icon);
    }
    return () => {
      icon.parentElement?.removeChild(icon);
    };
  }, [icon, size, borderRadius]);
  return <span ref={ref} />;
}
