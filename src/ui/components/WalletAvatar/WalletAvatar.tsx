import React from 'react';
import { useProfileNft } from 'src/ui/shared/wallet/getWalletProfiles';
import { AvatarIcon } from './AvatarIcon';

export function WalletAvatar({
  active = false,
  address,
  size,
  borderRadius = 6,
  icon,
  onReady,
}: {
  active?: boolean;
  address: string;
  size: number;
  borderRadius?: number;
  // TODO: should these be nullable instead of optional?
  icon?: React.ReactNode;
  onReady?(): void;
}) {
  const { data: nft, isLoading } = useProfileNft(address);

  if (isLoading) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        {icon}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <AvatarIcon
        active={active}
        address={address}
        size={size}
        nft={nft}
        borderRadius={borderRadius}
        onReady={onReady}
      />
      {icon}
    </div>
  );
}
