import React from 'react';
import { WalletAvatar } from 'src/ui/components/WalletAvatar';

const ICON_SIZE = 72;
const BORDER_RADIUS = 20;

export function SuccessStateAddress({ address }: { address: string }) {
  return (
    <div
      style={{
        width: ICON_SIZE,
        height: ICON_SIZE,
        borderRadius: BORDER_RADIUS,
        border: '4px solid var(--white)',
      }}
    >
      <WalletAvatar
        address={address}
        size={ICON_SIZE - 8}
        borderRadius={BORDER_RADIUS}
      />
    </div>
  );
}
