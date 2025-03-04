import { useQuery } from '@tanstack/react-query';
import type { Params } from '../requests/wallet-get-asset-details';
import { ZerionAPI } from '../zerion-api.client';

export function useWalletAssetDetails(
  params: Params,
  {
    suspense = false,
    enabled = true,
  }: {
    suspense?: boolean;
    enabled?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ['walletGetPnL', params],
    queryFn: () => ZerionAPI.walletGetAssetDetails(params),
    suspense,
    enabled,
  });
}
