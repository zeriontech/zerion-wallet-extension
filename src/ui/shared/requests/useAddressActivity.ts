import { useQuery } from '@tanstack/react-query';
import type { Params } from 'src/modules/zerion-api/requests/wallet-check-activity';
import type { BackendSourceParams } from 'src/modules/zerion-api/shared';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';

/**
 * `source` is required and has no default on purpose: this hook used to read the
 * testnet/mainnet channel implicitly from `DefiSdkClientProvider`, so a default
 * here would silently serve mainnet data in testnet mode.
 */
export function useAddressActivity(
  params: Params,
  { source }: BackendSourceParams,
  {
    enabled = true,
    keepPreviousData = false,
  }: { enabled?: boolean; keepPreviousData?: boolean } = {}
) {
  const query = useQuery({
    queryKey: ['walletCheckActivity', params, source],
    queryFn: () => ZerionAPI.walletCheckActivity(params, { source }),
    enabled: enabled && params.addresses.length > 0,
    keepPreviousData,
    staleTime: 20000,
  });
  return {
    ...query,
    isLoading: query.isInitialLoading,
    value: query.data ?? null,
  };
}
