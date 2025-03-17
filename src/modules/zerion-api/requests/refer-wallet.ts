import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Params {
  address: string;
  referralCode: string;
  signature: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function referWallet(this: ZerionApiContext, params: Params) {
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.post<Response>(
    {
      endpoint: 'wallet/refer/v1',
      body: JSON.stringify({
        address: params.address.toLowerCase(),
        referralCode: params.referralCode,
        signature: params.signature,
      }),
    },
    kyOptions
  );
}
