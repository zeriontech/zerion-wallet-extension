import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { Fungible } from '../types/Fungible';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Payload {
  /** @description Search phrase can be any text, wallet address, or wallet handle. */
  query: string;
  /** @description Currency to convert prices if section items include them. */
  currency: string;
  /** @description The network ID to search within. */
  chain?: string;
  /** @description Limit for each search section items count. */
  limit?: number;
}

export interface Response {
  data: Fungible[];
  errors?: { title: string; detail: string }[];
}

export function searchQueryFungibles(
  this: ZerionApiContext,
  { query, currency, chain, limit = 5 }: Payload,
  options?: ClientOptions
) {
  const params = new URLSearchParams({ query, currency, limit: String(limit) });
  if (chain != null) {
    params.append('chain', chain);
  }
  const endpoint = `search/query-fungibles/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
