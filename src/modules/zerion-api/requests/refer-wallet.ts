import { ZerionHttpClient } from '../shared';

interface Payload {
  address: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function referWallet(payload: Payload) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/refer/v1',
    body: JSON.stringify({ address: payload.address }),
  });
}
