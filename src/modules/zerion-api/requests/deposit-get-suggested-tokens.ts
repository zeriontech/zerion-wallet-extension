import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { OnrampAsset, OnrampEcosystem } from '../types/DepositFlow';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Params {
  /** @description Restricts the list to one ecosystem */
  ecosystem?: OnrampEcosystem;
  /**
   * @description Free-text search. Matches asset name and symbol only —
   * chain names are not searched, so `query=base` returns nothing.
   */
  query?: string;
}

export interface Response {
  data: {
    /** @description Null whenever `query` is set */
    featuredAssets: OnrampAsset[] | null;
    /** @description Null when nothing matches `query` */
    assets: OnrampAsset[] | null;
  };
  /** @description Always null for this endpoint */
  meta: null;
  /** @description Always null for successful responses */
  errors: null;
}

export function depositGetSuggestedTokens(
  this: ZerionApiContext,
  { ecosystem, query }: Params,
  options?: ClientOptions
) {
  const params = new URLSearchParams();
  if (ecosystem) {
    params.append('ecosystem', ecosystem);
  }
  if (query) {
    params.append('query', query);
  }
  const endpoint = `deposit/suggested-tokens/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
