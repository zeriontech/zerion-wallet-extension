import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { SOCIAL_API_URL } from 'src/env/config';
import {
  EmptyResult,
  requestWithCache,
} from 'src/ui/shared/requests/requestWithCache';
import {
  isMembershipValid,
  useAddressMembership,
} from 'src/ui/shared/requests/useAddressMembership';
import { AvatarIcon } from './AvatarIcon';
import type {
  WalletProfilesResponse,
  WalletProfile,
  WalletProfileNFT,
} from './types';
import { GradienBorder } from './GradientBorder';

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
): Promise<WalletProfileNFT | null> {
  const profile = await requestWithCache(
    `fetchWalletNFT ${address}`,
    fetchWalletProfile(address).then((result) => {
      if (!Object.keys(result || {}).length) {
        throw new EmptyResult();
      }
      return result;
    })
  );
  return profile?.nft || null;
}

export function WalletAvatar({
  active = false,
  address,
  size,
  borderRadius = 6,
  showPremium,
}: {
  active?: boolean;
  address: string;
  size: number;
  borderRadius?: number;
  showPremium?: boolean;
}) {
  const { data: nft, isLoading } = useQuery({
    queryKey: ['fetchWalletNFT', address],
    queryFn: () => fetchWalletNFT(address),
    suspense: false,
  });

  const { value: membershipInfo } = useAddressMembership({ address });

  const isPremium = isMembershipValid(membershipInfo);

  const border =
    isPremium && showPremium ? (
      <GradienBorder
        height={size}
        width={size}
        borderRadius={borderRadius}
        strokeWidth={size > 20 ? 2 : 1}
      />
    ) : null;

  if (isLoading) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        {border}
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
      {border}
    </div>
  );
}
