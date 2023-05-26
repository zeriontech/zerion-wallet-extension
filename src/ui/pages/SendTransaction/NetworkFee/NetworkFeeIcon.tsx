import React, { useMemo } from 'react';
import FastSrc from './assets/fast.png';
import Fast2xSrc from './assets/fast_2x.png';
import StandardSrc from './assets/standard.png';
import Standard2xSrc from './assets/standard_2x.png';
import CustomSrc from './assets/custom.png';
import Custom2xSrc from './assets/custom_2x.png';
import type { NetworkFeeSpeed } from './types';

function getNetworkSpeedSrc(speed: NetworkFeeSpeed, scale?: '2x') {
  if (speed === 'custom') {
    if (scale === '2x') return Custom2xSrc;
    return CustomSrc;
  }
  if (speed === 'standard') {
    if (scale === '2x') return Standard2xSrc;
    return StandardSrc;
  }
  if (speed === 'fast') {
    if (scale === '2x') return Fast2xSrc;
    return FastSrc;
  }
  throw new Error('Unexpected network fee speed');
}

export function NetworkFeeIcon({
  speed,
  ...props
}: React.HTMLAttributes<HTMLImageElement> & { speed: NetworkFeeSpeed }) {
  const src = useMemo(() => getNetworkSpeedSrc(speed), [speed]);
  const src2x = useMemo(() => getNetworkSpeedSrc(speed, '2x'), [speed]);
  return (
    <img
      {...props}
      src={src}
      alt={`${speed} icon`}
      srcSet={`${src}, ${src2x} 2x`}
    />
  );
}
