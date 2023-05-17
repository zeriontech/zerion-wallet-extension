import React from 'react';
import { useQuery } from 'react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { SOCIAL_API_URL } from 'src/env/config';
import {
  EmptyResult,
  requestWithCache,
} from 'src/ui/shared/requests/requestWithCache';
import { AvatarIcon } from './AvatarIcon';
import type {
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
  const profile = await requestWithCache(
    `fetchWalletNFT ${address}`,
    fetchWalletProfile(address).then((result) => {
      if (!Object.keys(result || {}).length) {
        throw new EmptyResult();
      }
      return result;
    })
  );
  return profile?.nft;
}

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
