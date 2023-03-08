import { useQuery } from 'react-query';
import { validateEmail } from 'src/ui/shared/validateEmail';
import { PROXY_URL } from 'src/env/config';
import { normalizeAddress } from 'src/shared/normalizeAddress';
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

export async function checkWhitelistStatus(addressOrEmail: string) {
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
