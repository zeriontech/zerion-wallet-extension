import ky from 'ky';
import { SOCIAL_API_URL } from 'src/env/config';
import { useQuery } from '@tanstack/react-query';
import { signMessage } from './wallet/signMessage';
import type { MediaContentValue } from './types/MediaContentValue';
import { normalizeAddress } from './normalizeAddress';
import { EmptyResult, requestWithCache } from './requestWithCache';

interface AuthData {
  auth_data: {
    address: string;
    expire_at: number;
    token: string;
  } | null;
  status: boolean;
}

class AuthError extends Error {}

const endpoints = {
  checkAuthStatus: `${SOCIAL_API_URL}api/v2/auth/`,
  authorize: `${SOCIAL_API_URL}api/v2/auth/authorize/`,
  generateMessage: (address: string) =>
    `${SOCIAL_API_URL}api/v2/auth/${address}/generate_message/`,
  getProfiles: `${SOCIAL_API_URL}api/v2/profiles/`,
  updateAvatar: `${SOCIAL_API_URL}api/v2/profiles/update_avatar/`,
  removeAvatar: `${SOCIAL_API_URL}api/v2/profiles/remove_avatar/`,
};

export interface WalletProfile {
  address: string;
  nft: {
    chain: string;
    contract_address: string;
    token_id: string;
    metadata: {
      name: string;
      content: MediaContentValue;
    };
  } | null;
}

class ProfileManager {
  private getAuthHeaders(token: string) {
    return new Headers(token ? { Authorization: token } : {});
  }

  private async getMessageForSigning(address: string) {
    const rawAnswer = await ky
      .post(endpoints.generateMessage(address), {
        timeout: 30000,
        retry: 1,
      })
      .json<{ message: string }>();

    return rawAnswer.message;
  }

  private async authorize(address: string, signature: string) {
    const rawAnswer = await ky
      .post(endpoints.authorize, {
        timeout: 30000,
        retry: 1,
        body: JSON.stringify({
          address,
          signature,
        }),
      })
      .json<AuthData | { error?: string }>();

    if ('error' in rawAnswer) {
      throw new AuthError(rawAnswer.error);
    }

    return rawAnswer as AuthData;
  }

  private async getAuthToken(address: string) {
    const message = await this.getMessageForSigning(normalizeAddress(address));
    const signedMessage = await signMessage(message);
    try {
      const result = await this.authorize(
        normalizeAddress(address),
        signedMessage
      );
      if (result?.status) {
        return result.auth_data?.token;
      }
      return null;
    } catch {
      return null;
    }
  }

  async getWalletProfile(address: string) {
    const searchParams = new URLSearchParams();
    searchParams.append('address', normalizeAddress(address));
    const socialData = await ky
      .get(`${endpoints.getProfiles}?${searchParams}`, {
        timeout: 30000,
        retry: 0,
      })
      .json<{ profiles: WalletProfile[] | null }>();
    return socialData.profiles?.[0];
  }

  async updateProfileAvatar(
    address: string,
    nft: {
      chain: string;
      contract_address: string;
      token_id: string;
    }
  ) {
    try {
      const token = await this.getAuthToken(address);
      if (!token) {
        return false;
      }
      return ky
        .post(endpoints.updateAvatar, {
          timeout: 30000,
          retry: 1,
          headers: this.getAuthHeaders(token),
          body: JSON.stringify({
            avatar_nft_id: nft,
          }),
        })
        .json<object>();
    } catch (error) {
      return false;
    }
  }

  async removeProfileAvatar(address: string) {
    try {
      const token = await this.getAuthToken(address);
      if (!token) {
        return false;
      }
      return ky
        .post(endpoints.removeAvatar, {
          timeout: 30000,
          retry: 1,
          headers: this.getAuthHeaders(token),
        })
        .json<object>();
    } catch {
      return false;
    }
  }
}

export const profileManager = new ProfileManager();

export async function fetchWalletNFT(
  address: string,
  options?: { updateCache?: boolean }
): Promise<WalletProfile['nft'] | null> {
  const profile = await requestWithCache(
    `fetchWalletNFT ${normalizeAddress(address)}`,
    (() => {
      return profileManager.getWalletProfile(address).then((result) => {
        if (!Object.keys(result || {}).length) {
          throw new EmptyResult();
        }
        return result;
      });
    })(),
    options?.updateCache ? { cacheTime: 0 } : undefined
  );
  return profile?.nft || null;
}

export function useProfileNft(address: string) {
  return useQuery({
    queryKey: [`fetchWalletNFT ${normalizeAddress(address)}`],
    queryFn: async () => {
      const result = await fetchWalletNFT(address);
      return result;
    },
    suspense: false,
  });
}
