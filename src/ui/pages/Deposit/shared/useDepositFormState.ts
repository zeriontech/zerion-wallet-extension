import { useCallback, useMemo } from 'react';
import { toFiatCurrencyCode } from 'src/modules/currency/currencies';
import { useCurrency } from 'src/modules/currency/useCurrency';
import { useDepositSuggestedTokens } from 'src/modules/zerion-api/hooks/useDepositSuggestedTokens';
import { useDepositSupportedCountries } from 'src/modules/zerion-api/hooks/useDepositSupportedCountries';
import { useDetectedCountry } from 'src/modules/zerion-api/hooks/useDetectedCountry';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
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
  const { preferences, setPreferences } = usePreferences();

  // Only ask where the user is if they haven't already told us — this visit
  // (the URL) or any previous one (their preferences)
  const savedCountryId = preferences?.depositCountryId || undefined;
  const hasCountryId = Boolean(userFormState.countryId || savedCountryId);
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
      countryId: savedCountryId ?? detectedCountryQuery.data?.data.countryCode,
    }),
    [
      preferredCurrency,
      featuredAsset,
      savedCountryId,
      detectedCountryQuery.data,
    ]
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

  /**
   * The country goes to two places: the URL, so the rest of the form reacts to
   * it like every other field, and preferences, so the next visit starts from
   * the answer the user gave rather than from their IP again.
   */
  const setCountryId = useCallback(
    (countryId: string) => {
      handleChange('countryId', countryId);
      setPreferences({ depositCountryId: countryId });
    },
    [handleChange, setPreferences]
  );

  const countries = countriesQuery.data?.data.countries;
  const supportedCountry = useMemo(
    () => countries?.find((country) => country.id === formState.countryId),
    [countries, formState.countryId]
  );

  return {
    formState,
    handleChange,
    setCountryId,
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
