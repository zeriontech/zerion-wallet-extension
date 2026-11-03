import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';
import type { PendingActionWire } from './wallet-get-actions';

export type OrderStatus = 'pending' | 'successful' | 'failed' | 'rejected';

export type OrderActionState = 'pending' | 'unsigned' | 'mined';

export type OrderActionWire = PendingActionWire & { state: OrderActionState };

export interface OrderFill {
  chain: string;
  hash: string;
}

export interface Params {
  orderId: string;
  /** @description Without it the backend returns `actions: null` */
  currency?: string;
}

export type Response = ResponseBody<{
  status: OrderStatus;
  /** @description Empty until the Order settles; multi-step routes may have several */
  fills: OrderFill[];
  actions?: OrderActionWire[] | null;
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
  if (params.currency) {
    searchParams.set('currency', params.currency);
  }
  const endpoint = `transaction/get-order-status/v1?${searchParams}`;
  return ZerionHttpClient.get<Response>(
    { endpoint, ...options },
    { ...kyOptions, retry: 0 }
  );
}
