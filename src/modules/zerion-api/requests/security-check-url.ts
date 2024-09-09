import { ZerionHttpClient } from '../shared';

interface Payload {
  url: string;
}

interface Response {
  data: {
    maliciousScore: number;
    flags: {
      isMalicious: boolean;
    };
  } | null;
  errors?: { title: string; detail: string }[];
}

export function securityCheckUrl(payload: Payload) {
  const params = new URLSearchParams({ url: payload.url });
  const endpoint = `security/check-url/v1?${params}`;
  return ZerionHttpClient.get<Response>({ endpoint });
}
