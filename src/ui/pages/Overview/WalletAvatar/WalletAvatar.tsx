import React from 'react';
import { useQuery } from 'react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { SOCIAL_API_URL } from 'src/env/config';
import { WalletIcon } from 'src/ui/ui-kit/WalletIcon';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { useAddressBoost } from 'src/ui/shared/requests/useAddressBoost';
import { WalletProfilesResponse, WalletProfile } from './types';

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

async function fetchWalletNFTImage(
  address: string
): Promise<string | undefined> {
  const profile = await fetchWalletProfile(address);
  return profile?.nft?.preview?.url;
}

export function WalletAvatar({ address }: { address: string }) {
  const { data: isConnected } = useIsConnectedToActiveTab(address);
  const { data: nftUrl } = useQuery(
    ['fetchWalletNFTImage', address],
    () => fetchWalletNFTImage(address),
    { suspense: false }
  );
  const { data: boostData } = useAddressBoost({ address });
  const star = boostData?.boost?.boost_status != null;

  return (
    <WalletIcon
      active={Boolean(isConnected)}
      star={star}
      address={address}
      iconSize={64}
      imageUrl={nftUrl}
    />
  );
}
