import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/asset-get-fungible-full-info';
import type { BackendSourceParams } from '../shared';

const ONE_MINUTE = 1000 * 60;

export function useAssetFullInfo(
  params: Params,
  { source }: BackendSourceParams,
  { suspense = false }: { suspense?: boolean } = {}
) {
  return useQuery({
    queryKey: ['assetGetFungibleFullInfo', params, source],
    queryFn: () => ZerionAPI.assetGetFungibleFullInfo(params, { source }),
    suspense,
    staleTime: ONE_MINUTE,
  });
}
