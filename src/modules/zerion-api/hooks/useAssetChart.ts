import { useQuery, keepPreviousData as keepPreviousDataPlaceholder } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/asset-get-chart';

export function useAssetChart(params: Params) {
  return useQuery({
    queryKey: ['assetGetChart', params],
    queryFn: () => ZerionAPI.assetGetChart(params),
    placeholderData: keepPreviousDataPlaceholder,
    staleTime: 1000 * 60,
  });
}
