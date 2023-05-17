import ky from 'ky';
import { useQuery } from 'react-query';
import { isEmail } from 'src/shared/isEmail';
import { PROXY_URL } from 'src/env/config';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getAddressNfts } from '../shared/requests/addressNfts/useAddressNfts';
import { WaitlistCheckError, NotAllowedError } from './errors';

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
        isEmail(addressOrEmail)
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

async function getFirebaseStatus(address: string) {
  return ky
    .get(new URL(`check-extension-access?address=${address}`, PROXY_URL), {
      timeout: 30000,
      retry: 0,
    })
    .json<{ status: boolean }>();
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
    .get(new URL(`remote-config?${params.toString()}`, PROXY_URL), {
      timeout: 30000,
      retry: 0,
    })
    .json<FirebaseConfig>();

  const normalizedAddress = normalizeAddress(address);

  if (
    !normalizeAddress ||
    !firebaseConfig.extension_access_nft_collections?.length
  ) {
    return { status: false };
  }

  const { value } = await getAddressNfts({
    address: normalizedAddress,
    currency: 'usd',
    collection_ids: firebaseConfig.extension_access_nft_collections,
    sorted_by: 'created_recently',
  });

  return { status: (value?.length || 0) > 0 };
}

export async function checkWhitelistStatus(address: string) {
  let foundAddressInWaitlist = false;
  const handler = (result: { status: boolean }) => {
    if (!result.status) {
      throw new NotAllowedError();
    }
    return result;
  };
  return Promise.any([
    getFirebaseStatus(address).then(handler),
    getNftStatus(address).then(handler),
    getWaitlistStatus(address).then((result) => {
      foundAddressInWaitlist = true;
      return handler(result);
    }),
  ]).catch(() => {
    if (foundAddressInWaitlist) {
      throw new NotAllowedError();
    }
    throw new WaitlistCheckError();
  });
}

export function useWhitelistStatus(address?: string) {
  return useQuery(
    `check waitlist status for ${address}`,
    async () => {
      if (!address) {
        return { status: false };
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
