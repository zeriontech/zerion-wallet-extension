import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface ExecuteOrderPayload {
  /** @description `quoteId` of the quote being executed */
  quoteId: string;
  /**
   * @description EVM: tx hash (lowercase 0x hex) or EIP-712 signature.
   * Solana: the tx signature (base58) or the signed transaction (base64).
   */
  signatureSwap: string;
  /** @description Must be omitted entirely when absent: an empty string is a 400 */
  signatureApprove?: string;
}

export type Response = ResponseBody<{
  /** @description Opaque Order id for `transaction/get-order-status/v1` */
  orderId: string;
}>;

/** Never retried: the backend does not deduplicate orders (WLT-2763) */
export function transactionExecuteOrder(
  this: ZerionApiContext,
  params: ExecuteOrderPayload,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const endpoint = 'transaction/execute-order/v1';
  const kyOptions = this.getKyOptions();
  const body: ExecuteOrderPayload = {
    quoteId: params.quoteId,
    signatureSwap: params.signatureSwap,
  };
  if (params.signatureApprove) {
    body.signatureApprove = params.signatureApprove;
  }
  return ZerionHttpClient.post<Response>(
    { endpoint, body: JSON.stringify(body), ...options },
    { ...kyOptions, retry: 0 }
  );
}
