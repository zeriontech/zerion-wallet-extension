import { useQuery } from '@tanstack/react-query';
import { perpDexs } from '../api/requests/perp-dexs.client';
import type { DexIdentifier } from '../api/requests/perp-dexs.types';

async function fetchDexList(): Promise<DexIdentifier[]> {
  const response = await perpDexs();
  // Always include the main perp DEX (undefined) first.
  const dexs: DexIdentifier[] = [undefined];
  if (Array.isArray(response)) {
    for (const entry of response) {
      if (entry && entry.name) dexs.push(entry.name);
    }
  }
  return dexs;
}

export const PERP_DEXS_QUERY_KEY = 'hyperliquid/perpDexs';

export const perpDexsQueryOptions = {
  queryKey: [PERP_DEXS_QUERY_KEY] as const,
  queryFn: fetchDexList,
  staleTime: 1000 * 60 * 5,
  keepPreviousData: true,
  retry: 1,
  suspense: false,
};

export function usePerpDexs({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    ...perpDexsQueryOptions,
    enabled,
  });
}
