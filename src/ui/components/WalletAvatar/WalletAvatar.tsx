import React from 'react';
import { useWalletsMetaByChunks } from 'src/ui/shared/requests/useWalletsMetaByChunks';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { AvatarIcon } from './AvatarIcon';

export function WalletAvatar({
  active = false,
  address,
  size,
  borderRadius = 6,
  borderWidth,
  icon,
  onReady,
}: {
  active?: boolean;
  address: string;
  size: number;
  borderRadius?: number;
  borderWidth?: number; // Optional for backward compatibility
  // TODO: should these be nullable instead of optional?
  icon?: React.ReactNode;
  onReady?(): void;
}) {
  const { data, isLoading } = useWalletsMetaByChunks({
    addresses: [normalizeAddress(address)],
    suspense: false,
    useErrorBoundary: false,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  const isPremium = Boolean(data?.at(0)?.membership.premium);

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
        nft={data?.at(0)?.nft}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        onReady={onReady}
        highlight={isPremium}
      />
      {icon}
    </div>
  );
}
