import ky from 'ky';
import React from 'react';
import { useQuery } from 'react-query';

const CAMPAIGN_ID = '642ff18d8638fa83e707916b';

export function InvitationBanner({ address }: { address: string }) {
  const { data } = useQuery(`get invitations for ${address}`, async () => {
    const referrer = '0x236e4cb97df4c9c9bb18cf0a56585e880883689f'; // address
    return ky
      .post(
        `https://dev.dashboard-api.linkdrop.io/api/v2/referrals/${CAMPAIGN_ID}/${referrer}`,
        {
          headers: {
            'x-secret-key': '5J9GF2XzsTAB',
          },
        }
      )
      .json();
  });

  console.log(data);
  return <div />;
}
