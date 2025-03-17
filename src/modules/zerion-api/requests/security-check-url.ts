import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Params {
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

export function securityCheckUrl(
  this: ZerionApiContext,
  payload: Params,
  options?: ClientOptions
) {
  const params = new URLSearchParams({ url: payload.url });
  const kyOptions = this.getKyOptions();
  const endpoint = `security/check-url/v1?${params}`;
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
