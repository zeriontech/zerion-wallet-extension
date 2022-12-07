import React from 'react';
import { useQuery } from 'react-query';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { SOCIAL_API_URL } from 'src/env/config';
import { WalletIcon } from 'src/ui/ui-kit/WalletIcon';
import { useIsConnectedToActiveTab } from 'src/ui/shared/requests/useIsConnectedToActiveTab';
import { WalletProfilesResponse, WalletProfile } from './types';

async function fetchWalletProfile(
  address: string
): Promise<WalletProfile | undefined> {
  const params = new URLSearchParams({ address: normalizeAddress(address) });
  const response = await fetch(`${SOCIAL_API_URL}api/v1/profiles/?${params}`);
  const { profiles } = response.json() as unknown as WalletProfilesResponse;
  return profiles?.[0];
}

async function fetchWalletNFTImage(
  address: string
): Promise<string | undefined> {
  const profile = await fetchWalletProfile(address);
  return profile?.nft?.preview?.url;
}

export function WalletAvatar() {
  const { singleAddress: address } = useAddressParams();
  const { data: isConnected } = useIsConnectedToActiveTab(address);
  const { data: nftUrl } = useQuery('wallet/fetchWalletNFTImage', () =>
    fetchWalletNFTImage(address)
  );

  return (
    <WalletIcon
      active={Boolean(isConnected)}
      address={address}
      iconSize={64}
      imageUrl={nftUrl}
    />
  );
}
