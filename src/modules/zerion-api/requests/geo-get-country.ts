import type { ClientOptions } from '../shared';
import { ZerionHttpClient } from '../shared';
import type { ZerionApiContext } from '../zerion-api-bare';

export interface Response {
  data: {
    /**
     * @description The caller's ISO 3166-1 alpha-2 country code, resolved from
     * the request IP. Not guaranteed to be in
     * `deposit/supported-countries/v1`.
     * @example GB
     */
    countryCode: string;
  };
  /** @description Always null for this endpoint */
  meta: null;
  /** @description Always null for successful responses */
  errors: null;
}

export function geoGetCountry(
  this: ZerionApiContext,
  _params?: undefined,
  options?: ClientOptions
) {
  const endpoint = 'geo/country/v1';
  const kyOptions = this.getKyOptions();
  return ZerionHttpClient.get<Response>({ endpoint, ...options }, kyOptions);
}
