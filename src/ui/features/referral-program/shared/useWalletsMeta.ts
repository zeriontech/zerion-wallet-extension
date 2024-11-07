import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';

export function useWalletsMetaByChunks({
  addresses,
  enabled = true,
}: {
  addresses: string[];
  enabled?: boolean;
}) {
  return useQuery({
    enabled: enabled && addresses.length > 0,
    queryKey: ['ZerionAPI.getWalletsMetaByChunks', addresses],
    queryFn: () => ZerionAPI.getWalletsMetaByChunks(addresses),
  });
}
