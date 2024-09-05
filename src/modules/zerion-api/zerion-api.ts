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

type UrlInput = { endpoint: string } | { url: string | URL };

const resolveUrl = (input: UrlInput): string | URL => {
  return 'endpoint' in input
    ? new URL(input.endpoint, ZERION_API_URL)
    : input.url;
};

export class ZerionAPI {
  static get<T>(params: UrlInput) {
    const url = resolveUrl(params);
    return ky.get(url, { headers: getZpiHeaders() }).json<T>();
  }

  static post<T>({ body, ...input }: UrlInput & { body: BodyInit }) {
    const url = resolveUrl(input);
    return ky.post(url, { body, headers: getZpiHeaders() }).json<T>();
  }

  static securityCheckUrl(payload: SecurityCheckUrlPayload) {
    const params = new URLSearchParams({ url: payload.url });
    return this.get<SecurityCheckUrlResponse>({
      endpoint: `security/check-url/v1?${params}`,
    });
  }

  static registerChain(payload: RegisterChainPayload) {
    return this.post<RegisterChainResponse>({
      endpoint: 'wallet/connect-chain/v1',
      body: JSON.stringify({
        chain: payload.chain,
        addresses: payload.addresses,
      }),
    });
  }

  static registerAddresses(payload: RegisterAddressesPayload) {
    return this.post<RegisterAddressesResponse>({
      endpoint: 'wallet/import/v1',
      body: JSON.stringify({ addresses: payload.addresses }),
    });
  }

  static getWalletsMeta({ identifiers }: WalletsMetaPayload) {
    const params = new URLSearchParams({ identifiers: identifiers.join(',') });
    return this.get<WalletsMetaResponse>({
      endpoint: `wallet/get-meta/v1?${params}`,
    });
  }

  static getGasPrices(
    { chain }: GetGasPricesPayload,
    { source }: BackendSourceParams
  ) {
    const base = source === 'testnet' ? ZERION_TESTNET_API_URL : ZERION_API_URL;
    const url = new URL('chain/get-gas-prices/v1', base);
    url.searchParams.set('chain', chain.toString());
    return ZerionAPI.get<GetGasPricesResponse>({ url });
  }

  static checkPaymasterEligibility(
    tx: PartiallyRequired<
      Pick<IncomingTransaction, 'chainId' | 'from' | 'nonce'>,
      'chainId' | 'from'
    >,
    { source }: BackendSourceParams
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
    const base = source === 'testnet' ? ZERION_TESTNET_API_URL : ZERION_API_URL;
    const url = new URL(`/paymaster/check-eligibility/v1?${params}`, base);
    return ZerionAPI.get<PaymasterCheckEligibilityResponse>({ url });
  }

  static async getPaymasterParams(
    request: {
      from: string;
      to: string;
      nonce: string;
      chainId: string;
      gas: string;
      gasPerPubdataByte: string;
      maxFee: string;
      maxPriorityFee: string;
      value: string;
      data: string;
    },
    { source }: BackendSourceParams
  ) {
    interface PaymasterParamsResponse {
      data: {
        eligible: boolean;
        paymasterParams: {
          paymaster: string;
          paymasterInput: string;
        };
        chargesData: {
          amount: number;
          deadline: string;
          eta: null;
        };
      };
      errors?: null | { title: string; detail: string }[];
    }
    const base = source === 'testnet' ? ZERION_TESTNET_API_URL : ZERION_API_URL;
    const params = new URLSearchParams(request);
    const url = new URL(`/paymaster/get-params/v1?${params}`, base);
    return ZerionAPI.get<PaymasterParamsResponse>({ url });
  }
}
