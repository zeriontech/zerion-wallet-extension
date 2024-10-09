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

export function referWallet(params: Params) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/refer/v1',
    body: JSON.stringify({ address: params.address }),
  });
}
