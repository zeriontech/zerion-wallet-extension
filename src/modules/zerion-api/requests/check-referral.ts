import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Params {
  referralCode: string;
}

export interface ReferrerData {
  referralCode: string;
  address: string | null;
  handle: string | null;
}

interface Response {
  data: ReferrerData;
  errors?: { title: string; detail: string }[];
}

export function checkReferral(this: ZerionApiContext, payload: Params) {
  const params = new URLSearchParams({ referralCode: payload.referralCode });
  const kyOptions = this.getKyOptions();
  const endpoint = `wallet/check-referral/v1?${params}`;
  return ZerionHttpClient.get<Response>({ endpoint }, kyOptions);
}
