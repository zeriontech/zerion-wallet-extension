import ky from 'ky';
import { useQuery } from '@tanstack/react-query';
import { SOCIAL_API_URL } from 'src/env/config';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { WalletMeta } from 'src/modules/zerion-api/requests/wallets-meta';
import { persistentQuery } from '../requests/queryClientPersistence';

// TODO: move to ZPI endpoint
const endpoints = {
  getProfiles: `${SOCIAL_API_URL}api/v2/profiles/`,
};

export interface WalletProfile {
  address: string;
  nft: WalletMeta['nft'];
}

async function getWalletProfile(address: string) {
  const searchParams = new URLSearchParams();
  searchParams.append('address', normalizeAddress(address));
  const socialData = await ky
    .get(`${endpoints.getProfiles}?${searchParams}`, {
      timeout: 30000,
      retry: 1,
    })
    .json<{ profiles: WalletProfile[] | null }>();
  return socialData.profiles?.[0];
}

async function fetchWalletNFT(
  address: string
): Promise<WalletProfile['nft'] | null> {
  const profile = await getWalletProfile(address);
  return profile?.nft || null;
}

export function useProfileNft(address: string) {
  const normalizedAddress = normalizeAddress(address);
  return useQuery({
    queryKey: persistentQuery(['fetchWalletNFT', normalizedAddress]),
    queryFn: async () => {
      const result = await fetchWalletNFT(normalizedAddress);
      return result;
    },
    suspense: false,
    useErrorBoundary: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 60000,
    retry: 0,
  });
}
