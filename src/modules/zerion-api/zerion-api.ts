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
import type {
  Payload as GetGasPricesPayload,
  Response as GetGasPricesResponse,
} from './requests/get-gas-prices';

function getZpiHeaders() {
  return {
    'X-Request-Id': crypto.randomUUID(),
    'Zerion-Client-Type': platform,
    'Zerion-Client-Version': version,
    'Content-Type': 'application/json',
  };
}

export class ZerionAPI {
  static get<T>(url: string) {
    return ky
      .get(new URL(url, ZERION_API_URL), { headers: getZpiHeaders() })
      .json<T>();
  }

  static post<T>(url: string, { body }: { body: BodyInit }) {
    return ky
      .post(new URL(url, ZERION_API_URL), {
        body,
        headers: getZpiHeaders(),
      })
      .json<T>();
  }

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

  static getGasPrices(payload: GetGasPricesPayload) {
    return ky
      .get(new URL('chain/get-gas-prices/v1', ZERION_API_URL), {
        searchParams: {
          chain: payload.chain.toString(),
        },
        headers: getZpiHeaders(),
      })
      .json<GetGasPricesResponse>();
  }
}
