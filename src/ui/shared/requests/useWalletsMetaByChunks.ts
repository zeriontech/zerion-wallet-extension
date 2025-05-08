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
  return useQuery({
    enabled: enabled && addresses.length > 0,
    queryKey: ['ZerionAPI.getWalletsMetaByChunks', addresses],
    queryFn: async () => {
      const result = await ZerionAPI.getWalletsMetaByChunks(addresses);
      if (result.length > 1) {
        result.forEach((walletMeta) => {
          const normalizedAddress = normalizeAddress(walletMeta.address);
          queryClient.setQueryData(
            ['ZerionAPI.getWalletsMetaByChunks', [normalizedAddress]],
            [walletMeta]
          );
        });
      }
      return result;
    },
    suspense,
    useErrorBoundary,
    staleTime,
  });
}
