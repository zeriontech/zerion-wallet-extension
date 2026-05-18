import { useQuery } from '@tanstack/react-query';
import { perpActiveAssetData } from '../api/requests/perp-active-asset-data.client';

export const PERP_ACTIVE_ASSET_DATA_QUERY_KEY = 'hyperliquid/activeAssetData';

export function perpActiveAssetDataQueryOptions(payload: {
  address: string | null | undefined;
  coin: string;
}) {
  const { address, coin } = payload;
  return {
    queryKey: [PERP_ACTIVE_ASSET_DATA_QUERY_KEY, address, coin] as const,
    queryFn: () =>
      perpActiveAssetData({
        address: address as string,
        coin,
      }),
    staleTime: 10_000,
    keepPreviousData: true,
    retry: 1,
  };
}

export function usePerpActiveAssetData(
  payload: {
    address: string | null | undefined;
    coin: string;
  },
  {
    enabled = true,
    refetchInterval,
  }: { enabled?: boolean; refetchInterval?: number | false } = {}
) {
  return useQuery({
    queryKey: [PERP_ACTIVE_ASSET_DATA_QUERY_KEY, payload.address, payload.coin],
    queryFn: () =>
      perpActiveAssetData({
        address: payload.address as string,
        coin: payload.coin,
      }),
    enabled: enabled && Boolean(payload.address) && Boolean(payload.coin),
    staleTime: 10_000,
    keepPreviousData: true,
    retry: 1,
    refetchInterval,
  });
}
