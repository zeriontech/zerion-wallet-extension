import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/asset-get-fungible-full-info';
import type { BackendSourceParams } from '../shared';

export function useAssetFullInfo(
  params: Params,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
  }: { suspense?: boolean; enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['assetGetFungibleFullInfo', params, source],
    queryFn: () => ZerionAPI.assetGetFungibleFullInfo(params, { source }),
    suspense,
    enabled,
    staleTime: 20000,
    retry: 1,
  });
}
