import { useQuery } from '@tanstack/react-query';
import ky from 'ky';
import { PROXY_URL } from 'src/env/config';
import { useFirebaseConfig } from 'src/modules/remote-config/plugins/firebase';
import { invariant } from 'src/shared/invariant';
import { signMessage } from 'src/ui/shared/wallet/signMessage';

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
  const signature = await signMessage(
    `Please, send me invitation codes for ${address}`
  );
  return ky
    .post(
      new URL(`linkdrop/api/v2/referrals/${campaignId}/${address}`, PROXY_URL),
      { headers: { signature } }
    )
    .json<InvitationInfo>();
}

export function useInvitationInfo(
  address?: string,
  { useErrorBoundary = true }: { useErrorBoundary?: boolean } = {}
) {
  const { data } = useFirebaseConfig(['extension_invitation_campaign_id']);
  const campaignId = data?.extension_invitation_campaign_id;
  return useQuery({
    queryKey: ['getInvitationInfo', address, campaignId],
    queryFn: async () => {
      invariant(address, 'address should exist to fetch invitation data');
      invariant(campaignId, 'campaignId should exist to fetch invitation data');
      return getInvitationInfo(address, campaignId);
    },
    suspense: false,
    enabled: Boolean(address) && Boolean(campaignId),
    useErrorBoundary,
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

export async function getClaimLinkStatus(linkId: string) {
  return ky
    .get(
      `https://dashboard-api.linkdrop.io/api/v2/claim-links/${linkId}/status`
    )
    .json<InvitationLinkInfo>();
}
