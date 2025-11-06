import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/asset-list-fungibles';

export function useAssetListFungibles(
  params: Params,
  { suspense = false }: { suspense?: boolean } = {}
) {
  return useQuery({
    queryKey: ['assetListFungibles', params],
    queryFn: () => ZerionAPI.assetListFungibles(params),
    suspense,
    staleTime: 20000,
  });
}
