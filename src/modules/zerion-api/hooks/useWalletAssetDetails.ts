import { useQuery } from '@tanstack/react-query';
import type { Params } from '../requests/wallet-get-asset-details';
import { ZerionAPI } from '../zerion-api.client';
import type { BackendSourceParams } from '../shared';

export function useWalletAssetDetails(
  params: Params,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
  }: {
    suspense?: boolean;
    enabled?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ['walletGetAssetDetails', params, source],
    queryFn: () => ZerionAPI.walletGetAssetDetails(params, { source }),
    suspense,
    enabled,
    staleTime: 20000,
  });
}
