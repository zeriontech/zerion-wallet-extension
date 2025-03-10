import { useQuery } from '@tanstack/react-query';
import type { Params } from '../requests/asset-get-fungible-pnl';
import { ZerionAPI } from '../zerion-api.client';

const TEN_MINUTES = 1000 * 60 * 10;

export function useAssetAddressPnl(
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
    queryKey: ['assetGetFungiblePnl', params],
    queryFn: () => ZerionAPI.assetGetFungiblePnl(params),
    suspense,
    enabled,
    staleTime: TEN_MINUTES,
  });
}
