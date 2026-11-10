import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/asset-list-fungibles';

export function useAssetListFungibles(
  params: Params,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['assetListFungibles', params],
    queryFn: () => ZerionAPI.assetListFungibles(params),
    enabled,
    staleTime: 20000,
  });
}
