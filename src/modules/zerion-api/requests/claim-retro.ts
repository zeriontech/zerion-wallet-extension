import { normalizeAddress } from 'src/shared/normalizeAddress';
import { ZerionHttpClient } from '../shared';

interface Params {
  address: string;
  signature: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function claimRetro(params: Params) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/claim-retro/v1',
    body: JSON.stringify({
      address: normalizeAddress(params.address),
      signature: params.signature,
    }),
  });
}
