import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { Fungible } from '../types/Fungible';
import type { FungibleAssetsSortedBy } from '../types/FungibleAssetsSortedBy';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Params {
  /** @description Search phrase can be any text, wallet address, or wallet handle. */
  query?: string;
  /** @description Currency to convert prices if section items include them. */
  currency: string;
  /** @description The network ID to search within. */
  chain?: string;
  /** @description Limit for each search section items count. */
  limit?: number;
  /** @description Sorting direction */
  sort?: FungibleAssetsSortedBy;
  /** @description Cursor which was returned from the backend side. */
  cursor?: string;
}

export interface Response {
  data: Fungible[];
  meta: {
    pagination: {
      /**
       * @description Cursor can contain any type of information; clients should not rely on its contents, but should simply send it as it is. // [!code link {"token":"Cursor","href":"/docs/entities.html#cursor"}]
       * @example 10
       */
      cursor: string;
    };
  };
  errors?: { title: string; detail: string }[];
}

export function searchQueryFungibles(
  this: ZerionApiContext,
  { query, currency, chain, sort, cursor, limit = 5 }: Params,
  options?: ClientOptions
) {
  const params = new URLSearchParams({ currency, limit: String(limit) });
  if (query) {
    params.append('query', query);
  }
  if (chain != null) {
    params.append('chain', chain);
  }
  if (sort != null) {
    params.append('sort', sort);
  }
  if (cursor) {
    params.append('cursor', cursor);
  }
  const endpoint = `search/query-fungibles/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
