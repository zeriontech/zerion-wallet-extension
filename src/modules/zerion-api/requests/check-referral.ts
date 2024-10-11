import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';

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

export function checkReferral(payload: Params, options?: ClientOptions) {
  const params = new URLSearchParams({ referralCode: payload.referralCode });
  const endpoint = `wallet/check-referral/v1?${params}`;
  return ZerionHttpClient.get<Response>({ endpoint, ...options });
}
