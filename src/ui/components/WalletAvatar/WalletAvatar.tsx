import React from 'react';
import { useProfileNft } from 'src/ui/shared/wallet/getWalletProfiles';
import { AvatarIcon } from './AvatarIcon';

export function WalletAvatar({
  active = false,
  address,
  size,
  borderRadius = 6,
  icon,
}: {
  active?: boolean;
  address: string;
  size: number;
  borderRadius?: number;
  icon?: React.ReactNode;
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
      />
      {icon}
    </div>
  );
}
