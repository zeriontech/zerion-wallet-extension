import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { Fungible } from '../types/Fungible';
import type { ZerionApiContext } from '../zerion-api-bare';

interface Payload {
  /** @description Search phrase can be any text, wallet address, or wallet handle. */
  query: string;
  /** @description Currency to convert prices if section items include them. */
  currency: string;
  /** @description Limit for each search section items count. */
  limit?: number;
}

type DApp = {
  /**
   * @description Unique identifier for the DApp // [!code link {"token":"DApp","href":"/docs/entities.html#dapp"}]
   * @example uniswap-v2
   */
  id: string;
  /**
   * @description Name of the DApp // [!code link {"token":"DApp","href":"/docs/entities.html#dapp"}]
   * @example Uniswap V2
   */
  name: string;
  /**
   * @description URL to the DApp's icon // [!code link {"token":"DApp","href":"/docs/entities.html#dapp"}]
   * @example https://protocol-icons.s3.amazonaws.com/icons/uniswap-v2.jpg
   */
  iconUrl: string;
  /**
   * @description URL to the DApp's website // [!code link {"token":"DApp","href":"/docs/entities.html#dapp"}]
   * @example https://app.uniswap.org/
   */
  url: string;
};

type Wallet = {
  /** @example test.zerion.eth */
  name: string;
  /** @example https://lh3.googleusercontent.com/MtCGsfm3h_n9wjzVloLzF4ocL4nhU9iYL81HKpZ4wZxCF6bwB2RFmK6hI7EO_fmPwPKjAx-d-qKsqNrVjn2jbJLibAW0-nBqYQ=s250 */
  iconUrl: string | null;
  /** @example 0x42b9df65b219b3dd36ff330a4dd8f327a6ada990 */
  address: string;
  /** @example false */
  premium?: boolean;
};

export interface Response {
  data: {
    /** @description The array will contain DApps that satisfy the search query. */
    dapps?: DApp[];
    /** @description The array with contain Fungibles (Assets) that satisfy the search query. */
    fungibles?: Fungible[];
    /** @description The array with contain Wallets that satisfy the search query. */
    wallets?: Wallet[];
  };
  errors?: { title: string; detail: string }[];
}

export function searchQuery(
  this: ZerionApiContext,
  { query, currency, limit = 5 }: Payload,
  options?: ClientOptions
) {
  const params = new URLSearchParams({ query, currency, limit: String(limit) });
  const endpoint = `search/query/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
