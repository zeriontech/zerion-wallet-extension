import React from 'react';
import type { NetworkFeeSpeed } from 'src/shared/types/TransactionConfiguration';
import BoltIcon from 'jsx:src/ui/assets/bolt.svg';
import HourglassIcon from 'jsx:src/ui/assets/hourglass.svg';
import SlidersIcon from 'jsx:src/ui/assets/settings-sliders.svg';

export function NetworkFeeIcon({
  speed,
  ...props
}: React.SVGProps<SVGSVGElement> & { speed: NetworkFeeSpeed }) {
  const Icon =
    speed === 'fast'
      ? BoltIcon
      : speed === 'average'
      ? HourglassIcon
      : speed === 'custom'
      ? SlidersIcon
      : null;
  if (!Icon) {
    throw new Error('Unexpected network fee speed');
  }
  return <Icon {...props} aria-hidden="true" />;
}

export function NetworkFeeIconBadge({ speed }: { speed: NetworkFeeSpeed }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: '50%',
        background: 'var(--white)',
      }}
    >
      <NetworkFeeIcon speed={speed} style={{ width: 20, height: 20 }} />
    </span>
  );
}
