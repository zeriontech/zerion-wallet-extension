/**
 * Everything the deposit flow keeps in the URL. Living in search params rather
 * than component state is what lets `RouteRestoration` bring a half-filled form
 * back after the popup closes.
 */
export interface DepositFormState extends Record<string, string | undefined> {
  /** Asset id from `deposit/suggested-tokens/v1` */
  outputFungibleId?: string;
  /** Chain id from `deposit/suggested-tokens/v1` */
  outputChain?: string;
  /** Lowercase fiat currency code */
  currency?: string;
  /** Free-text fiat amount, as typed */
  fiatValue?: string;
  /** ISO 3166-1 alpha-2 country code */
  countryId?: string;
}
