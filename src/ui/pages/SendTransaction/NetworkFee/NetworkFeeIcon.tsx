import React, { useMemo } from 'react';
import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';
import FastSrc from 'url:./assets/fast.png';
import Fast2xSrc from 'url:./assets/fast_2x.png';
import SlowSrc from 'url:./assets/slow.png';
import Slow2xSrc from 'url:./assets/slow_2x.png';
import CustomSrc from 'url:./assets/custom.png';
import Custom2xSrc from 'url:./assets/custom_2x.png';
import { NETWORK_SPEED_TO_TITLE } from './constants';

function getNetworkSpeedSrc(speed: NetworkFeeSpeed, scale?: '2x') {
  if (speed === 'custom') {
    return scale === '2x' ? Custom2xSrc : CustomSrc;
  }
  if (speed === 'average') {
    return scale === '2x' ? Slow2xSrc : SlowSrc;
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
      alt={`${NETWORK_SPEED_TO_TITLE[speed]} icon`}
      srcSet={`${src}, ${src2x} 2x`}
    />
  );
}
