import { ZerionHttpClient } from '../shared';

interface Payload {
  addresses: string[];
  chain: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function registerChain(payload: Payload) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/connect-chain/v1',
    body: JSON.stringify({
      chain: payload.chain,
      addresses: payload.addresses,
    }),
  });
}
