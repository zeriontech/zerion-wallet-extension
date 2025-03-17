import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Params {
  addresses: string[];
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function registerAddresses(
  this: ZerionApiContext,
  payload: Params,
  options?: ClientOptions
) {
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'wallet/import/v1',
      body: JSON.stringify({ addresses: payload.addresses }),
      ...options,
    },
    kyOptions
  );
}
