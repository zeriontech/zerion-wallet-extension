import ky from 'ky';
import { v4 as uuidv4 } from 'uuid';
import { version } from 'src/shared/packageVersion';
import { ZERION_API_URL } from 'src/env/config';
import type {
  Payload as SecurityCheckUrlPayload,
  Response as SecurityCheckUrlRespose,
} from './requests/security-check-url';

function getZpiHeaders() {
  return {
    'X-Request-Id': uuidv4(),
    'Zerion-Client-Type': 'web-extensions',
    'Zerion-Client-Version': version,
  };
}

export class ZerionAPI {
  static securityCheckUrl(payload: SecurityCheckUrlPayload) {
    return ky
      .get(new URL('security/check-url/v1', ZERION_API_URL), {
        searchParams: { url: payload.url },
        headers: getZpiHeaders(),
        mode: 'no-cors',
        credentials: 'same-origin',
      })
      .json<SecurityCheckUrlRespose>();
  }
}
