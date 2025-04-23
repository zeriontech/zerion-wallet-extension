import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { useMemo } from 'react';
import { produce } from 'immer';
import { type Params } from '../requests/asset-get-chart';

export function useAssetChart(params: Params) {
  const query = useQuery({
    queryKey: ['assetGetChart', params],
    queryFn: () => ZerionAPI.assetGetChart(params),
    suspense: false,
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  const data = useMemo(() => {
    return produce(query.data, (draft) => {
      if (!draft?.data.points.length) return;

      draft.data.points = draft.data.points.map((point) => ({
        ...point,
        extra:
          Math.random() > 0.93 ? { total: Math.random() * 100 - 50 } : null,
      }));
    });
  }, [query.data]);

  return { ...query, data };
}
