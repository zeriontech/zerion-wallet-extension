import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export type OrderStatus = 'pending' | 'successful' | 'failed' | 'rejected';

export interface OrderFill {
  chain: string;
  hash: string;
}

export interface Params {
  orderId: string;
}

export type Response = ResponseBody<{
  status: OrderStatus;
  /** @description Empty until the Order settles; multi-step routes may have several */
  fills: OrderFill[];
}>;

export function isTerminalOrderStatus(status: OrderStatus) {
  return status !== 'pending';
}

export function transactionGetOrderStatus(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const kyOptions = this.getKyOptions();
  const searchParams = new URLSearchParams();
  searchParams.set('orderId', params.orderId);
  const endpoint = `transaction/get-order-status/v1?${searchParams}`;
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
