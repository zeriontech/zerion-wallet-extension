import ky from 'ky';
import { version } from 'src/shared/packageVersion';
import { ZERION_API_URL } from 'src/env/config';
import type {
  Payload as SecurityCheckUrlPayload,
  Response as SecurityCheckUrlResponse,
} from './requests/security-check-url';
import type {
  Payload as RegisterChainPayload,
  Response as RegisterChainResponse,
} from './requests/register-chain';

function getZpiHeaders() {
  return {
    'X-Request-Id': crypto.randomUUID(),
    'Zerion-Client-Type': 'web-extension',
    'Zerion-Client-Version': version,
  };
}

export class ZerionAPI {
  static securityCheckUrl(payload: SecurityCheckUrlPayload) {
    return ky
      .get(new URL('security/check-url/v1', ZERION_API_URL), {
        searchParams: { url: payload.url },
        headers: getZpiHeaders(),
      })
      .json<SecurityCheckUrlResponse>();
  }
  static registerChain(payload: RegisterChainPayload) {
    return ky
      .post(new URL('wallet/connect/v1', ZERION_API_URL), {
        body: JSON.stringify({
          chain: payload.chain,
          identifier: payload.address,
        }),
        headers: getZpiHeaders(),
      })
      .json<RegisterChainResponse>();
  }
}
