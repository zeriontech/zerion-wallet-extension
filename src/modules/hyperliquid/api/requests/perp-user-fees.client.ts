import { postInfo } from '../postInfo';
import type { PerpUserFees, PerpUserFeesPayload } from './perp-user-fees.types';

export async function perpUserFees(
  payload: PerpUserFeesPayload
): Promise<PerpUserFees | null> {
  return postInfo<PerpUserFees>({
    type: 'userFees',
    user: payload.address,
  });
}
