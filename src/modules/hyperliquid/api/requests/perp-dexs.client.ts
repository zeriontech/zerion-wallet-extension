import { postInfo } from '../postInfo';
import type { PerpDexsResponse } from './perp-dexs.types';

export async function perpDexs(): Promise<PerpDexsResponse | null> {
  return postInfo<PerpDexsResponse>({ type: 'perpDexs' });
}
