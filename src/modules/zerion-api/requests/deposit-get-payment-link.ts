import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Params {
  address: string;
  /** @description ISO 3166-1 alpha-2 country code */
  countryId: string;
  /** @description Lowercase fiat currency code, e.g. `usd` */
  currency: string;
  assetId: string;
  chainId: string;
  /** @description Decimal string, e.g. `100` */
  fiatAmount: string;
  /** @description `provider.id` of the chosen quote */
  providerId: string;
  /** @description `id` of one of that quote's `supportedPaymentMethods` */
  paymentMethodId: string;
  referrerDomain: string;
  /** @description Where the provider sends the user once they are done */
  redirectUrl: string;
}

export interface Response {
  data: {
    /** @description The provider's checkout URL, signed and single-use */
    url: string;
  };
  /** @description Always null for this endpoint */
  meta: null;
  /** @description Always null for successful responses */
  errors: null;
}

export function depositGetPaymentLink(
  this: ZerionApiContext,
  {
    address,
    countryId,
    currency,
    assetId,
    chainId,
    fiatAmount,
    providerId,
    paymentMethodId,
    referrerDomain,
    redirectUrl,
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
    providerId,
    paymentMethodId,
    referrerDomain,
    redirectUrl,
  });
  const endpoint = `deposit/payment-link/v1?${params}`;
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
