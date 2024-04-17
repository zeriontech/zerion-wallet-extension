import { useGlobalPreferences } from 'src/ui/features/preferences/usePreferences';

type CurrencyResult =
  | { currency: null; ready: false }
  | { currency: string; ready: true };

export function useCurrency(): CurrencyResult {
  const { globalPreferences } = useGlobalPreferences();

  const currency = globalPreferences?.currency;
  return currency
    ? { currency, ready: true }
    : { currency: null, ready: false };
}
