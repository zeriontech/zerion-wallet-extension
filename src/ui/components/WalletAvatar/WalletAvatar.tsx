import React from 'react';
import { useQuery } from 'react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { SOCIAL_API_URL } from 'src/env/config';
import { AvatarIcon } from './AvatarIcon';
import {
  WalletProfilesResponse,
  WalletProfile,
  WalletProfileNFT,
} from './types';

async function fetchWalletProfile(
  address: string
): Promise<WalletProfile | undefined> {
  const url = new URL('/api/v1/profiles', SOCIAL_API_URL);
  url.searchParams.append('address', normalizeAddress(address));
  const response = await fetch(url);
  const { profiles } =
    (await response.json()) as unknown as WalletProfilesResponse;
  return profiles?.[0];
}

async function fetchWalletNFT(
  address: string
): Promise<WalletProfileNFT | undefined> {
  const profile = await fetchWalletProfile(address);
  return profile?.nft;
}

export function WalletAvatar({
  active = false,
  address,
  size,
  borderRadius = '6px',
}: {
  active?: boolean;
  address: string;
  size: number;
  borderRadius?: string;
}) {
  const { data: nft, isLoading } = useQuery(
    ['fetchWalletNFT', address],
    () => fetchWalletNFT(address),
    { suspense: false }
  );

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
