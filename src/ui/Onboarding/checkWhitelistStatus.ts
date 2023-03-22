import ky from 'ky';
import { useQuery } from 'react-query';
import { validateEmail } from 'src/ui/shared/validateEmail';
import { PROXY_URL } from 'src/env/config';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getAddressNfts } from '../shared/requests/addressNfts/useAddressNfts';
import { WaitlistCheckError } from './errors';

const WAITLIST_ID = 'aOfkJhcpwDHpJVkzO6FB';

interface WaitlistResponse {
  cryptoAddress: string;
  email: string;
  fields: { hasAccess: boolean };
  hasJoinedNewsletter: boolean;
  id: string;
  listId: string;
  rankingPoints: number;
  rankingPosition: number;
  referral: string;
  referralsCount: number;
  source: 'online_form';
  status: 'subscribed';
}

export async function getWaitlistStatus(addressOrEmail: string) {
  const rawResponse = await fetch(
    new URL(`pandatools/lists/${WAITLIST_ID}/members/search`, PROXY_URL),
    {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(
        validateEmail(addressOrEmail)
          ? { email: addressOrEmail }
          : {
              cryptoAddress: addressOrEmail,
            }
      ),
    }
  );
  const response: WaitlistResponse = await rawResponse.json();
  return {
    status: response.fields.hasAccess,
    address: normalizeAddress(response.cryptoAddress),
  };
}

interface FirebaseConfig {
  extension_access_nft_collections: string[];
}

const FIREBASE_PARAMS = ['extension_access_nft_collections'];

async function getNftStatus(address: string) {
  const params = new URLSearchParams(
    FIREBASE_PARAMS.map((key) => ['key', key])
  );
  const firebaseConfig = await ky
    .get(`https://proxy.zerion.io/remote-config?${params.toString()}`, {
      timeout: 30000,
      retry: 0,
    })
    .json<FirebaseConfig>();

  if (!firebaseConfig.extension_access_nft_collections?.length) {
    return { status: false };
  }

  const { value } = await getAddressNfts({
    address: address?.toLowerCase() || '',
    currency: 'usd',
    collection_ids: firebaseConfig.extension_access_nft_collections,
    sorted_by: 'created_recently',
  });

  return { status: (value?.length || 0) > 0 };
}

async function checkAllowance(promises: Promise<{ status: boolean }>[]) {
  return new Promise<{ status: boolean }>((resolve, reject) => {
    let settledChecks = 0;
    let error: Error | null = null;
    for (let i = 0; i < promises.length; i++) {
      promises[i]
        .then((result) => {
          if (result.status) {
            resolve(result);
          }
        })
        .catch((e) => {
          error = e;
        })
        .finally(() => {
          settledChecks += 1;
          if (settledChecks === promises.length) {
            if (error) {
              reject(error);
            }
            resolve({ status: false });
          }
        });
    }
  });
}

export async function checkWhitelistStatus(address: string) {
  return checkAllowance([getNftStatus(address), getWaitlistStatus(address)]);
}

export function useWhitelistStatus(address?: string) {
  return useQuery(
    `check waitlist status for ${address}`,
    async () => {
      if (!address) {
        return false;
      }
      try {
        return checkWhitelistStatus(address);
      } catch {
        throw new WaitlistCheckError();
      }
    },
    {
      enabled: Boolean(address),
      suspense: false,
      retry: 0,
      refetchOnWindowFocus: false,
    }
  );
}
