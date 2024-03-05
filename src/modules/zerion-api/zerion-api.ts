import ky from 'ky';
import { version } from 'src/shared/packageVersion';
import { ZERION_API_URL } from 'src/env/config';
import { platform } from 'src/shared/analytics/platform';
import type {
  Payload as SecurityCheckUrlPayload,
  Response as SecurityCheckUrlResponse,
} from './requests/security-check-url';
import type {
  Payload as RegisterChainPayload,
  Response as RegisterChainResponse,
} from './requests/register-chain';
import type {
  Payload as RegisterAddressesPayload,
  Response as RegisterAddressesResponse,
} from './requests/register-wallets';
import type {
  Payload as WalletsMetaPayload,
  Response as WalletsMetaResponse,
} from './requests/wallets-meta';

function getZpiHeaders() {
  return {
    'X-Request-Id': crypto.randomUUID(),
    'Zerion-Client-Type': platform,
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
      .post(new URL('wallet/connect-chain/v1', ZERION_API_URL), {
        body: JSON.stringify({
          chain: payload.chain,
          addresses: payload.addresses,
        }),
        headers: getZpiHeaders(),
      })
      .json<RegisterChainResponse>();
  }

  static registerAddresses(payload: RegisterAddressesPayload) {
    return ky
      .post(new URL('wallet/import/v1', ZERION_API_URL), {
        body: JSON.stringify({
          addresses: payload.addresses,
        }),
        headers: getZpiHeaders(),
      })
      .json<RegisterAddressesResponse>();
  }

  static getWalletsMeta(payload: WalletsMetaPayload) {
    return ky
      .get(new URL('wallet/get-meta/v1', ZERION_API_URL), {
        searchParams: { identifiers: payload.identifiers.join(',') },
        headers: getZpiHeaders(),
      })
      .json<WalletsMetaResponse>();
  }
}
