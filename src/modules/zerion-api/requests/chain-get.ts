import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ChainFullInfo } from '../types/ChainFullInfo';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  /** @description EIP-155 numeric chain id. This endpoint is EVM-only by construction */
  eip155Id: number;
}

/** Unknown chains answer 404 with `errors[]`, never `data: null` */
export type Response = ResponseBody<ChainFullInfo>;

export function chainGet(
  this: ZerionApiContext,
  { eip155Id }: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const params = new URLSearchParams({ eip155Id: String(eip155Id) });
  const endpoint = `chain/get/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
