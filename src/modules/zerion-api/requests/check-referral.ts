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

export function checkReferral(params: Params) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/check-referral/v1',
    body: JSON.stringify({ referralCode: params.referralCode }),
  });
}
