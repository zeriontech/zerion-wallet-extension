import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/asset-get-chart';

export function useAssetChart(
  params: Params,
  {
    suspense = false,
  }: {
    suspense?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ['assetGetChart', params],
    queryFn: () => ZerionAPI.assetGetChart(params),
    suspense,
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });
}
