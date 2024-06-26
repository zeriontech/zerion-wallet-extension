import ky from 'ky';
import { version } from 'src/shared/packageVersion';
import { ZERION_API_URL, ZERION_TESTNET_API_URL } from 'src/env/config';
import { platform } from 'src/shared/analytics/platform';
import type { PartiallyRequired } from 'src/shared/type-utils/PartiallyRequired';
import { invariant } from 'src/shared/invariant';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { valueToHex } from 'src/shared/units/valueToHex';
import type { IncomingTransaction } from '../ethereum/types/IncomingTransaction';
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

export type NetworksSource = 'mainnet' | 'testnet';

interface BackendSourceParams {
  source: NetworksSource;
}

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

  static getGasPrices({
    chain,
    source,
  }: GetGasPricesPayload & BackendSourceParams) {
    const apiUrl =
      source === 'testnet' ? ZERION_TESTNET_API_URL : ZERION_API_URL;
    return ky
      .get(new URL('chain/get-gas-prices/v1', apiUrl), {
        searchParams: {
          chain: chain.toString(),
        },
        headers: getZpiHeaders(),
      })
      .json<GetGasPricesResponse>();
  }

  static checkPaymasterEligibility(
    tx: PartiallyRequired<
      Pick<IncomingTransaction, 'chainId' | 'from' | 'nonce'>,
      'chainId' | 'from'
    >
  ) {
    const { nonce, chainId, from } = tx;
    invariant(nonce != null, 'Nonce is required to check eligibility');
    const params = new URLSearchParams({
      from,
      chainId: normalizeChainId(chainId),
      nonce: valueToHex(nonce),
      backend_env: 'zero',
    });
    interface PaymasterCheckEligibilityResponse {
      data: { eligible: boolean; eta: null | number };
      errors?: null | { title: string; detail: string }[];
    }
    return ZerionAPI.get<PaymasterCheckEligibilityResponse>(
      `/paymaster/check-eligibility/v1?${params}`
    );
  }
}
