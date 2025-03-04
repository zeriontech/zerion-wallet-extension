import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/asset-get-fungible-full-info';

export function useAssetFullInfo(
  params: Params,
  {
    suspense = false,
  }: {
    suspense?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ['assetGetFungibleFullInfo', params],
    queryFn: async () => {
      return ZerionAPI.assetGetFungibleFullInfo(params);
    },
    suspense,
    staleTime: 1000 * 60,
  });
}
