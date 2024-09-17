import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';

interface Params {
  addresses: string[];
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function registerAddresses(payload: Params, options?: ClientOptions) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/import/v1',
    body: JSON.stringify({ addresses: payload.addresses }),
    ...options,
  });
}
