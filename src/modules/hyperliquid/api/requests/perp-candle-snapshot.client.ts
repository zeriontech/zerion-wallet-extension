import { postInfo } from '../postInfo';
import type {
  PerpCandle,
  PerpCandleSnapshotPayload,
} from './perp-candle-snapshot.types';

export async function perpCandleSnapshot(
  payload: PerpCandleSnapshotPayload
): Promise<PerpCandle[] | null> {
  return postInfo<PerpCandle[]>({
    type: 'candleSnapshot',
    req: {
      coin: payload.coin,
      interval: payload.interval,
      startTime: payload.startTime,
      endTime: payload.endTime,
    },
  });
}
