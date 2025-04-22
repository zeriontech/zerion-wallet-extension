import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';

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
    queryFn: () => ZerionAPI.getWalletsMetaByChunks(addresses),
    suspense,
    useErrorBoundary,
    staleTime,
  });
}
