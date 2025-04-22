import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { queryClient } from './queryClient';

export function useWalletsMetaByChunks({
  addresses,
  enabled = true,
  suspense = true,
  useErrorBoundary = true,
  staleTime,
}: {
  addresses: string[];
  enabled?: boolean;
  suspense?: boolean;
  useErrorBoundary?: boolean;
  staleTime?: number;
}) {
  const query = useQuery({
    enabled: enabled && addresses.length > 0,
    queryKey: ['ZerionAPI.getWalletsMetaByChunks', addresses],
    queryFn: () => ZerionAPI.getWalletsMetaByChunks(addresses),
    suspense,
    useErrorBoundary,
    staleTime,
  });

  // Update query cache with wallet meta data for each address
  // to make it prefetched for single address requests (e.g. wallet avatar)
  useEffect(() => {
    if ((query.data?.length || 0) <= 1) {
      // No need to update cache if there's only one wallet meta
      return;
    }
    query.data?.forEach((walletMeta) => {
      const normalizedAddress = normalizeAddress(walletMeta.address);
      queryClient.setQueryData(
        ['ZerionAPI.getWalletsMetaByChunks', [normalizedAddress]],
        [walletMeta]
      );
    });
  }, [query.data]);

  return query;
}
