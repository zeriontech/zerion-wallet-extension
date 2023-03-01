const WAITLIST_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsaXN0SWQiOiJhT2ZrSmhjcHdESHBKVmt6TzZGQiIsIm1lbWJlcklkIjoiYkhaTDl0Um5IQ1puWkFkSzN5WXMiLCJpYXQiOjE2Nzc0OTE2MzEsImV4cCI6MTY4MDk0NzYzMSwiYXVkIjoiem9vdG9vbHMtbWVtYmVyLWFjY2Vzcy1qd3QifQ.nYHkfP1T4YvQCNU32ZrTNlhPpuJMMKoeOjTmY8DGoQk';
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

export async function checkWhitelistStatus(address: string) {
  const rawResponse = await fetch(
    `https://audience-consumer-api.zootools.co/lists/${WAITLIST_ID}/members/search`,
    {
      method: 'post',
      headers: {
        Authorization: `Bearer ${WAITLIST_API_KEY}`,
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
