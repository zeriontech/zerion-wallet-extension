import { useCallback, useMemo } from 'react';
import { toFiatCurrencyCode } from 'src/modules/currency/currencies';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useDepositSuggestedTokens } from 'src/modules/zerion-api/hooks/useDepositSuggestedTokens';
import { useDepositSupportedCountries } from 'src/modules/zerion-api/hooks/useDepositSupportedCountries';
import { useDetectedCountry } from 'src/modules/zerion-api/hooks/useDetectedCountry';
import { useSearchParamsObj } from 'src/ui/shared/forms/useSearchParamsObj';
import { getOnrampEcosystem } from './ecosystem';
import type { DepositFormState } from './types';

/**
 * The form's values, assembled by spreading whatever the user has touched over
 * freshly-computed defaults. There is no "has the user edited this" flag: a key
 * present in the URL *is* a user choice, so defaults stay live until overridden.
 */
export function useDepositFormState({ address }: { address: string }) {
  const [userFormState, setUserFormState] =
    useSearchParamsObj<DepositFormState>();

  const { currency: preferredCurrency } = useCurrency();

  // Only ask where the user is if they haven't already told us
  const hasCountryId = Boolean(userFormState.countryId);
  const detectedCountryQuery = useDetectedCountry({ enabled: !hasCountryId });
  const countriesQuery = useDepositSupportedCountries();

  // The default output asset is whatever the backend recommends for this
  // wallet's ecosystem. The web app hardcodes eth/ethereum, which is simply
  // wrong for a Solana wallet — that address cannot receive it.
  const suggestedTokensQuery = useDepositSuggestedTokens({
    ecosystem: getOnrampEcosystem(address),
  });
  const featuredAsset = suggestedTokensQuery.data?.data.featuredAssets?.at(0);

  const defaults = useMemo<DepositFormState>(
    () => ({
      currency: toFiatCurrencyCode(preferredCurrency),
      outputFungibleId: featuredAsset?.asset.id,
      outputChain: featuredAsset?.chain.id,
      countryId: detectedCountryQuery.data?.data.countryCode,
    }),
    [preferredCurrency, featuredAsset, detectedCountryQuery.data]
  );

  const formState = useMemo(
    () => ({ ...defaults, ...userFormState }),
    [defaults, userFormState]
  );

  const handleChange = useCallback(
    <K extends keyof DepositFormState>(key: K, value: DepositFormState[K]) =>
      setUserFormState((state) => ({ ...state, [key]: value })),
    [setUserFormState]
  );

  const countries = countriesQuery.data?.data.countries;
  const supportedCountry = useMemo(
    () => countries?.find((country) => country.id === formState.countryId),
    [countries, formState.countryId]
  );

  return {
    formState,
    handleChange,
    countries: countries ?? null,
    /**
     * `deposit/quotes/v1` returns an empty list for an unsupported country, an
     * unsupported currency *and* an out-of-range amount alike, so the only way
     * to recognise "we don't operate where you are" is list membership.
     */
    countryIsSupported: Boolean(supportedCountry),
    supportedCountry: supportedCountry ?? null,
    isLoading:
      suggestedTokensQuery.isLoading ||
      countriesQuery.isLoading ||
      (detectedCountryQuery.isLoading &&
        detectedCountryQuery.fetchStatus === 'fetching'),
  };
}
