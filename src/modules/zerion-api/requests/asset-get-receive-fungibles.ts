import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { Fungible } from '../types/Fungible';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Params {
  /** @description The network ID that will be used for filtering */
  chain?: string;
  /** @description Currency name */
  currency: string;
}

export type ReceiveFungibles = {
  /** @description List of popular fungible items */
  popular: Fungible[];
  /** @description List of other fungible items */
  others: Fungible[];
};

export interface Response {
  data: ReceiveFungibles;
  /** @description Always null for this endpoint */
  meta: null;
  /** @description Always null for successful responses */
  errors: null;
}

export function assetGetReceiveFungibles(
  this: ZerionApiContext,
  { chain, currency }: Params,
  options?: ClientOptions
) {
  const params = new URLSearchParams({ currency });
  if (chain != null) {
    params.append('chain', chain);
  }
  const endpoint = `asset/get-receive-fungibles/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
