import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';

export function useDepositSupportedCountries({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['depositGetSupportedCountries'],
    queryFn: () => ZerionAPI.depositGetSupportedCountries(),
    enabled,
    // The list of on-ramp countries does not change within a session
    staleTime: Infinity,
    suspense: false,
  });
}
