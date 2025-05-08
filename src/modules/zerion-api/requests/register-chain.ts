import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Params {
  addresses: string[];
  chain: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function registerChain(
  this: ZerionApiContext,
  payload: Params,
  options?: ClientOptions
) {
  const { chain, addresses } = payload;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'wallet/connect-chain/v1',
      body: JSON.stringify({ chain, addresses }),
      ...options,
    },
    kyOptions
  );
}
