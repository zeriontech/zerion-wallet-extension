import { ZerionHttpClient } from '../shared';

interface Params {
  referralCode: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function checkReferral(params: Params) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/check-referral/v1',
    body: JSON.stringify({ referralCode: params.referralCode }),
  });
}
