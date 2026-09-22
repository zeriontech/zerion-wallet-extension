import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';

/**
 * The caller's country, resolved from the request IP. Two consumers: it
 * pre-selects the deposit form's country (once the user picks one explicitly,
 * it is not consulted again), and it gates the UK / US swap disclaimers.
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
