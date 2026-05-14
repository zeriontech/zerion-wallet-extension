import { postInfo } from '../postInfo';
import type { PerpReferral, PerpReferralPayload } from './perp-referral.types';

export async function perpReferral(
  payload: PerpReferralPayload
): Promise<PerpReferral | null> {
  return postInfo<PerpReferral>({
    type: 'referral',
    user: payload.address,
  });
}
