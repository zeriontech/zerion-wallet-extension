import { postInfo } from '../postInfo';
import type {
  PerpMaxBuilderFeePayload,
  PerpMaxBuilderFeeResponse,
} from './perp-max-builder-fee.types';

export async function perpMaxBuilderFee(
  payload: PerpMaxBuilderFeePayload
): Promise<PerpMaxBuilderFeeResponse | null> {
  return postInfo<PerpMaxBuilderFeeResponse>({
    type: 'maxBuilderFee',
    user: payload.address,
    builder: payload.builder,
  });
}
