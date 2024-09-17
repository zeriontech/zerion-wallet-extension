import { ZerionHttpClient } from '../shared';

interface Payload {
  referralCode: string;
}

interface Response {
  data: null;
  errors?: { title: string; detail: string }[];
}

export function checkReferral(payload: Payload) {
  return ZerionHttpClient.post<Response>({
    endpoint: 'wallet/check-referral/v1',
    body: JSON.stringify({ referralCode: payload.referralCode }),
  });
}
