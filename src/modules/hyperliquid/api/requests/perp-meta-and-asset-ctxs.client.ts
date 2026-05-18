import { postInfo } from '../postInfo';
import type {
  PerpMetaAndAssetCtxsPayload,
  PerpMetaAndAssetCtxsResponse,
} from './perp-meta-and-asset-ctxs.types';

export async function perpMetaAndAssetCtxs(
  payload: PerpMetaAndAssetCtxsPayload = {}
): Promise<PerpMetaAndAssetCtxsResponse | null> {
  return postInfo<PerpMetaAndAssetCtxsResponse>({
    type: 'metaAndAssetCtxs',
    ...(payload.dexIdentifier ? { dex: payload.dexIdentifier } : {}),
  });
}
