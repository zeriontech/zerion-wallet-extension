import ky from 'ky';
import { SOCIAL_API_URL } from 'src/env/config';
import { emitter } from 'src/ui/shared/events';
import { signMessage } from './wallet/signMessage';

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
  checkAuthStatus: `${SOCIAL_API_URL}/auth/`,
  authorize: `${SOCIAL_API_URL}/auth/authorize/`,
  generateMessage: (address: string) =>
    `${SOCIAL_API_URL}/auth/${address}/generate_message/`,
  getProfiles: `${SOCIAL_API_URL}/profiles/`,
  updateAvatar: `${SOCIAL_API_URL}/profiles/update_avatar/`,
  removeAvatar: `${SOCIAL_API_URL}/profiles/remove_avatar/`,
};

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
    const message = await this.getMessageForSigning(address.toLowerCase());
    const signedMessage = await signMessage(message);
    try {
      const result = await this.authorize(address.toLowerCase(), signedMessage);
      if (result?.status) {
        return result.auth_data?.token;
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateProfileAvatar(address: string, tokenId: string) {
    try {
      // remove chain from tokenId
      const asset_code = tokenId.split(':').slice(1).join(':');
      const token = await this.getAuthToken(address);
      if (!token) {
        return false;
      }
      const rawAnswer = await ky
        .post(endpoints.updateAvatar, {
          timeout: 30000,
          retry: 1,
          headers: this.getAuthHeaders(token),
          body: JSON.stringify({
            avatar_nft_id: asset_code,
          }),
        })
        .json<object>();

      emitter.emit('setWalletAvatar', address);

      return rawAnswer;
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
      const rawAnswer = await ky
        .post(endpoints.removeAvatar, {
          timeout: 30000,
          retry: 1,
          headers: this.getAuthHeaders(token),
        })
        .json<object>();

      emitter.emit('setWalletAvatar', address);

      return rawAnswer;
    } catch {
      return false;
    }
  }
}

export const profileManager = new ProfileManager();
