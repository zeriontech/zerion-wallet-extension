import ky from 'ky';
import { HYPERLIQUID_EXCHANGE_URL } from '../constants';
import type { ExchangeRequestBody } from '../actions/types';
import type { ExchangeResponse } from './submitExchangeAction.types';

export type {
  ExchangeOrderLegStatus,
  ExchangeOrderResponseBody,
  ExchangeResponse,
  ExchangeResponseError,
  ExchangeResponseSuccess,
} from './submitExchangeAction.types';
export {
  getOrderLegError,
  isOrderResponseBody,
} from './submitExchangeAction.types';

export async function submitExchangeAction(
  body: ExchangeRequestBody
): Promise<ExchangeResponse> {
  return ky
    .post(HYPERLIQUID_EXCHANGE_URL, {
      json: body,
      timeout: 30000,
    })
    .json<ExchangeResponse>();
}
