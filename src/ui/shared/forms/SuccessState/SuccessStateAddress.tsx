import React from 'react';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';

const ICON_SIZE = 72;
const BORDER_RADIUS = 20;
const BORDER_WIDTH = 4;

export function SuccessStateAddress({ address }: { address: string }) {
  return (
    <div
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: BORDER_RADIUS,
        border: `${BORDER_WIDTH}px solid var(--white)`,
      }}
    >
      <WalletAvatar
        address={address}
        size={ICON_SIZE - BORDER_WIDTH * 2}
        borderRadius={BORDER_RADIUS}
      />
    </div>
  );
}
