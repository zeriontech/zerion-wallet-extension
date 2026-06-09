import { postInfo } from '../postInfo';
import type {
  SpotClearinghouseState,
  SpotClearinghouseStatePayload,
} from './spot-clearinghouse-state.types';

export async function spotClearinghouseState(
  payload: SpotClearinghouseStatePayload
): Promise<SpotClearinghouseState | null> {
  return postInfo<SpotClearinghouseState>({
    type: 'spotClearinghouseState',
    user: payload.address,
  });
}
