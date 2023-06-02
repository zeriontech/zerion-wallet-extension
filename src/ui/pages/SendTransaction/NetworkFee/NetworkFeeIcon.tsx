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
    return scale === '2x' ? Custom2xSrc : CustomSrc;
  }
  if (speed === 'standard') {
    return scale === '2x' ? Standard2xSrc : StandardSrc;
  }
  if (speed === 'fast') {
    return scale === '2x' ? Fast2xSrc : FastSrc;
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
