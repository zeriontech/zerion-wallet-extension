import { ZerionHttpClient } from '../shared';

interface Payload {
  addresses: string[];
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function registerAddresses(payload: Payload) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/import/v1',
    body: JSON.stringify({ addresses: payload.addresses }),
  });
}
