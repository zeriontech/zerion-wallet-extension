import { useQuery } from '@tanstack/react-query';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { useHttpClientSource } from 'src/modules/zerion-api/hooks/useHttpClientSource';

/** list-fungibles is batched in the same 50-id chunks as other asset lookups */
export const ASSET_LOOKUP_BATCH_SIZE = 50;

export async function fetchFungiblesByIds(
  ids: string[],
  currency: string,
  source: 'mainnet' | 'testnet'
): Promise<Fungible[]> {
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += ASSET_LOOKUP_BATCH_SIZE) {
    batches.push(ids.slice(index, index + ASSET_LOOKUP_BATCH_SIZE));
  }
  const responses = await Promise.all(
    batches.map((fungibleIds) =>
      ZerionAPI.assetListFungibles({ fungibleIds, currency }, { source })
    )
  );
  return responses.flatMap((response) => response.data ?? []);
}

/**
 * Metadata for the Hidden Assets list. Requested in stored-ordered, normalized
 * chunks so reordering the stored list does not refetch identical ids.
 */
export function useHiddenAssetFungibles(ids: string[], currency: string) {
  const source = useHttpClientSource();
  return useQuery({
    queryKey: ['hiddenAssetFungibles', ids, currency, source],
    queryFn: () => fetchFungiblesByIds(ids, currency, source),
    enabled: ids.length > 0,
    staleTime: 20000,
    suspense: false,
  });
}
