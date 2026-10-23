import type { TransactionMultichainBackend } from 'src/shared/types/Quote';
import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  /** @description `id` of an unsigned action from `wallet/get-actions/v1` */
  actionId: string;
}

export type Response = ResponseBody<{
  quoteId: string;
  transaction: TransactionMultichainBackend;
  intent: null;
}>;

export function transactionBuildAction(
  this: ZerionApiContext,
  params: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const endpoint = 'transaction/build-action/v1';
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint,
      body: JSON.stringify({ actionId: params.actionId }),
      ...options,
    },
    { ...kyOptions, retry: 0 }
  );
}
