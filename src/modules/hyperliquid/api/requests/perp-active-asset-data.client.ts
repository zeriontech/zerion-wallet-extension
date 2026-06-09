import { postInfo } from '../postInfo';
import type {
  PerpActiveAssetData,
  PerpActiveAssetDataPayload,
} from './perp-active-asset-data.types';

export async function perpActiveAssetData(
  payload: PerpActiveAssetDataPayload
): Promise<PerpActiveAssetData | null> {
  return postInfo<PerpActiveAssetData>({
    type: 'activeAssetData',
    user: payload.address,
    coin: payload.coin,
  });
}
