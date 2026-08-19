import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  /**
   * @description Transaction hash to be processed, starts with 0x
   * @example 0x123...123
   */
  hash: string;
  chain: string;
}

export type Response = ResponseBody<null>;

export function transactionCollect(
  this: ZerionApiContext,
  params: Params,
  options?: ClientOptions
) {
  const endpoint = 'transaction/collect/v1';
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    { endpoint, body: JSON.stringify(params), ...options },
    kyOptions
  );
}
