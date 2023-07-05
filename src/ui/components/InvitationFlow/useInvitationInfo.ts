import { useQuery } from '@tanstack/react-query';
import ky from 'ky';
import { PROXY_URL } from 'src/env/config';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/firebase';
import { invariant } from 'src/shared/invariant';
import { REFERRER_WITH_FREE_LINK } from './Debug';

type InvitationLinkStatus =
  | 'CREATED'
  | 'PENDING'
  | 'FAILED'
  | 'CLAIMED'
  | 'EXPIRED'
  | 'DEACTIVATED';

export interface ClaimCode {
  claim_code: string;
  link_id: string;
  status: InvitationLinkStatus;
}

export interface InvitationInfo {
  success: boolean;
  referrer: string;
  campaign_active: boolean;
  claim_codes: ClaimCode[];
}

async function getInvitationInfo(address: string, campaignId: string) {
  const referrer =
    localStorage.getItem('referrer_test') || REFERRER_WITH_FREE_LINK || address;
  return ky
    .post(
      new URL(`linkdrop/api/v2/referrals/${campaignId}/${referrer}`, PROXY_URL)
    )
    .json<InvitationInfo>();
}

export function useInvitationInfo(address?: string) {
  const { data } = useFirebaseConfig(['extension_invitation_campaign_id']);
  const campaignId = data?.extension_invitation_campaign_id;
  return useQuery({
    queryKey: [`get invitation info for ${address} for campaign ${campaignId}`],
    queryFn: async () => {
      invariant(address, 'address should exists to fetch invitation data');
      invariant(
        campaignId,
        'campaign id should exists to fetch invitation data'
      );
      return getInvitationInfo(address, campaignId);
    },
    suspense: false,
    enabled: Boolean(address) && Boolean(campaignId),
  });
}

interface InvitationLinkInfo {
  success: boolean;
  data: {
    link_id: string;
    status: InvitationLinkStatus;
    recipient?: string;
  };
}

export async function getInvitationLinkInfo(linkId: string) {
  return ky
    .get(
      `https://dashboard-api.linkdrop.io/api/v2/claim-links/${linkId}/status`
    )
    .json<InvitationLinkInfo>();
}
