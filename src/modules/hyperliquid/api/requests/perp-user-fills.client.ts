import { postInfo } from '../postInfo';
import type { PerpFill, PerpUserFillsPayload } from './perp-user-fills.types';

export async function perpUserFills(
  payload: PerpUserFillsPayload
): Promise<PerpFill[] | null> {
  return postInfo<PerpFill[]>({
    type: 'userFills',
    user: payload.address,
    aggregateByTime: true,
  });
}
