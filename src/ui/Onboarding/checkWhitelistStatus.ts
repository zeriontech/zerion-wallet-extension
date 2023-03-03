import { PROXY_URL } from 'src/env/config';

const WAITLIST_ID = 'aOfkJhcpwDHpJVkzO6FB';
const WAITLIST_URL = `${PROXY_URL}pandatools`;

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

export async function checkWhitelistStatus(address: string) {
  const rawResponse = await fetch(
    `${WAITLIST_URL}/lists/${WAITLIST_ID}/members/search`,
    {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        cryptoAddress: address,
      }),
    }
  );
  const response: WaitlistResponse = await rawResponse.json();
  return response.fields.hasAccess;
}
