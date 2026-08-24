import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { DepositQuote } from '../types/DepositFlow';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Params {
  address: string;
  /** @description ISO 3166-1 alpha-2 country code */
  countryId: string;
  /** @description Lowercase fiat currency code, e.g. `usd` */
  currency: string;
  /** @description Asset id from `deposit/suggested-tokens/v1` */
  assetId: string;
  /** @description Chain id from `deposit/suggested-tokens/v1` */
  chainId: string;
  /** @description Decimal string, e.g. `100` */
  fiatAmount: string;
  /**
   * @description When true, providers may return an Apple Pay payment method.
   * Sent as `supportsApplePay=true`; omitted entirely when false.
   */
  supportsApplePay?: boolean;
}

export interface Response {
  data: {
    /**
     * @description Empty when no provider serves this combination. Note that an
     * unsupported country, an unsupported fiat currency and an out-of-range
     * amount are all indistinguishable here — each returns `[]` with HTTP 200.
     * Whether the country itself is supported must come from
     * `deposit/supported-countries/v1`.
     */
    quotes: DepositQuote[];
  };
  /** @description Always null for this endpoint */
  meta: null;
  /** @description Always null for successful responses */
  errors: null;
}

export function depositGetQuotes(
  this: ZerionApiContext,
  {
    address,
    countryId,
    currency,
    assetId,
    chainId,
    fiatAmount,
    supportsApplePay,
  }: Params,
  options?: ClientOptions
) {
  const params = new URLSearchParams({
    address,
    countryId,
    currency,
    assetId,
    chainId,
    fiatAmount,
  });
  if (supportsApplePay) {
    params.append('supportsApplePay', 'true');
  }
  const endpoint = `deposit/quotes/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
