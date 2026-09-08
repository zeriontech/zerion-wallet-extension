import type { ClientOptions } from '../shared';
import { CLIENT_DEFAULTS, ZerionHttpClient } from '../shared';
import type { ChainFullInfo } from '../types/ChainFullInfo';
import type { ZerionApiContext } from '../zerion-api-bare';
import type { ResponseBody } from './ResponseBody';

export interface Params {
  /** @description When true, testnets are included in the response */
  includeTestnets?: boolean;
  /** @description When true, only chains with at least one supported feature are returned */
  supportedOnly?: boolean;
  /**
   * @description Case-insensitive substring match against chain id, chain name
   * and EIP-155 id. Filters *within* the set selected by the other params: it
   * does not widen {supportedOnly} and does not match the base asset symbol.
   * Never unique on its own (`42161` also matches `421613`).
   */
  searchQuery?: string;
}

export type Response = ResponseBody<ChainFullInfo[]>;

export function chainList(
  this: ZerionApiContext,
  { includeTestnets, supportedOnly, searchQuery }: Params,
  options: ClientOptions = CLIENT_DEFAULTS
) {
  const params = new URLSearchParams();
  if (includeTestnets != null) {
    params.append('includeTestnets', String(includeTestnets));
  }
  if (supportedOnly != null) {
    params.append('supportedOnly', String(supportedOnly));
  }
  if (searchQuery) {
    params.append('searchQuery', searchQuery);
  }
  const endpoint = `chain/list/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
