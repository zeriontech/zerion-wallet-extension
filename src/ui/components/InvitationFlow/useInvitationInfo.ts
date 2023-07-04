import { useQuery } from '@tanstack/react-query';
import ky from 'ky';
import { invariant } from 'src/shared/invariant';

export interface ClaimCode {
  claim_code: string;
  link_id: string;
  status:
    | 'CREATED'
    | 'PENDING'
    | 'FAILED'
    | 'CLAIMED'
    | 'EXPIRED'
    | 'DEACTIVATED';
}

export interface InvitationInfo {
  success: boolean;
  referrer: string;
  campaign_active: boolean;
  claim_codes: ClaimCode[];
}

const CAMPAIGN_ID = '647ecbe30ffb03816f5e5a0b';

async function getInvitationInfo(address: string) {
  const referrer = '0xdafe50ffa1c56e36ebd4a1baf1f6785dbd0267a7' || address;
  return ky
    .post(
      `https://dashboard-api.linkdrop.io/api/v2/referrals/${CAMPAIGN_ID}/${referrer}`,
      {
        headers: {
          'x-ref-campaign-key': '5J9GF2XzsTAB',
        },
      }
    )
    .json<InvitationInfo>();
}

export function useInvitationInfo(address?: string) {
  return useQuery({
    queryKey: [`get invitation info for ${address}`],
    queryFn: () => {
      invariant(address, 'address should exists to fetch invitation data');
      return getInvitationInfo(address);
    },
    suspense: false,
    enabled: Boolean(address),
  });
}
