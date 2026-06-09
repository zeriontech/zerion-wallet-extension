import { postInfo } from '../postInfo';
import type { PerpUserRole, PerpUserRolePayload } from './perp-user-role.types';

export async function perpUserRole(
  payload: PerpUserRolePayload
): Promise<PerpUserRole | null> {
  return postInfo<PerpUserRole>({
    type: 'userRole',
    user: payload.address,
  });
}
