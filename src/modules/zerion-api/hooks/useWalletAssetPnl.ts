import { useQuery } from '@tanstack/react-query';
import type { Params } from '../requests/asset-get-fungible-pnl';
import { ZerionAPI } from '../zerion-api.client';
import type { BackendSourceParams } from '../shared';

export function useWalletAssetPnl(
  params: Params,
  { source }: BackendSourceParams,
  {
    enabled = true,
  }: {
    enabled?: boolean;
  } = {},
) {
  return useQuery({
    queryKey: ['assetGetFungiblePnl', params, source],
    queryFn: () => ZerionAPI.assetGetFungiblePnl(params, { source }),
    enabled,
    staleTime: 20000,
  });
}
