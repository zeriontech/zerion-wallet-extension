import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';

interface Params {
  address: string;
  referralCode: string;
  signature: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function referWallet(params: Params, options?: ClientOptions) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/refer/v1',
    body: JSON.stringify({
      address: params.address,
      referralCode: params.referralCode,
      signature: params.signature,
    }),
    ...options,
  });
}
