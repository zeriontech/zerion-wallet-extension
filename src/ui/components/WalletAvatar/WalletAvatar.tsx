import React from 'react';
import { useProfileNft } from 'src/ui/shared/wallet/getWalletProfiles';
import { AvatarIcon } from './AvatarIcon';

export function WalletAvatar({
  active = false,
  address,
  size,
  borderRadius = 6,
}: {
  active?: boolean;
  address: string;
  size: number;
  borderRadius?: number;
}) {
  const { data: nft, isLoading } = useProfileNft(address);

  if (isLoading) {
    return <div style={{ width: size, height: size }} />;
  }

  return (
    <AvatarIcon
      active={active}
      address={address}
      size={size}
      nft={nft}
      borderRadius={borderRadius}
    />
  );
}
