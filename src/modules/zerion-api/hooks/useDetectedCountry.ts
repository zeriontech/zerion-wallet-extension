import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';

/**
 * The caller's country, resolved from the request IP. Only used to pre-select
 * the deposit form's country — once the user picks one explicitly, this is not
 * consulted again.
 */
export function useDetectedCountry({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['geoGetCountry'],
    queryFn: () => ZerionAPI.geoGetCountry(),
    enabled,
    // The user's location does not change within a session
    staleTime: Infinity,
    suspense: false,
  });
}
