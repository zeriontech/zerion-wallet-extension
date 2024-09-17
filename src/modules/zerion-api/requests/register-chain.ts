import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';

interface Params {
  addresses: string[];
  chain: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function registerChain(payload: Params, options?: ClientOptions) {
  const { chain, addresses } = payload;
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/connect-chain/v1',
    body: JSON.stringify({ chain, addresses }),
    ...options,
  });
}
