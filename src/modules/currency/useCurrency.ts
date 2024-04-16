import { usePreferences } from 'src/ui/features/preferences';

export function useCurrency() {
  const { preferences, query } = usePreferences();

  const { isLoading } = query;
  const currency = isLoading ? null : preferences?.currency || 'usd';

  return { currency, isLoading };
}
