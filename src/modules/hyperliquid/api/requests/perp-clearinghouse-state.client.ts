import { postInfo } from '../postInfo';
import type {
  PerpClearinghouseState,
  PerpClearinghouseStatePayload,
} from './perp-clearinghouse-state.types';

export async function perpClearinghouseState(
  payload: PerpClearinghouseStatePayload
): Promise<PerpClearinghouseState | null> {
  return postInfo<PerpClearinghouseState>({
    type: 'clearinghouseState',
    user: payload.address,
    ...(payload.dexIdentifier ? { dex: payload.dexIdentifier } : {}),
  });
}
