import { postInfo } from '../postInfo';
import type {
  NonFundingLedgerPayload,
  NonFundingLedgerUpdate,
} from './perp-non-funding-ledger.types';

export async function perpNonFundingLedger(
  payload: NonFundingLedgerPayload
): Promise<NonFundingLedgerUpdate[] | null> {
  return postInfo<NonFundingLedgerUpdate[]>({
    type: 'userNonFundingLedgerUpdates',
    user: payload.address,
    startTime: payload.startTime ?? 0,
  });
}
