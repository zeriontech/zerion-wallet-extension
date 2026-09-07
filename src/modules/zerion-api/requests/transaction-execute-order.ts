import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  /** @description `quoteId` of the Intent Swap quote being executed */
  quoteId: string;
  /**
   * @description Signature of the Swap Intent. EVM: EIP-712 signature (0x hex).
   * Solana: the signed transaction, base64.
   */
  signatureSwap: string;
  /**
   * @description EIP-712 signature of the Permit Approval. Must be omitted
   * entirely when the quote carried no `intentApprove` (an empty string is a 400).
   */
  signatureApprove?: string;
}

export type Response = ResponseBody<{
  /** @description Opaque Order id for `transaction/get-order-status/v1` */
  orderId: string;
}>;

/**
 * Places an Order for an Intent Swap. Never retried: a 400 means the quote is
 * stale or a signature is wrong, and the caller must re-quote and re-sign.
 */
export function transactionExecuteOrder(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const endpoint = 'transaction/execute-order/v1';
  const kyOptions = this.getKyOptions();
  const body: Params = {
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
