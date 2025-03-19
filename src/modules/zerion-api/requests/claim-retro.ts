import { normalizeAddress } from 'src/shared/normalizeAddress';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Params {
  address: string;
  signature: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function claimRetro(this: ZerionApiContext, params: Params) {
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'wallet/claim-retro/v1',
      body: JSON.stringify({
        address: normalizeAddress(params.address),
        signature: params.signature,
      }),
    },
    kyOptions
  );
}
