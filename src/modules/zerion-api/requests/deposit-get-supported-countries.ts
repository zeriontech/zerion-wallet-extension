import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { OnrampCountry } from '../types/DepositFlow';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Response {
  data: {
    /** @description Already sorted by name; ~233 entries */
    countries: OnrampCountry[];
  };
  /** @description Always null for this endpoint */
  meta: null;
  /** @description Always null for successful responses */
  errors: null;
}

export function depositGetSupportedCountries(
  this: ZerionApiContext,
  _params?: undefined,
  options?: ClientOptions
) {
  const endpoint = 'deposit/supported-countries/v1';
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
