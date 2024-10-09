import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';

export function useWalletsMeta({ addresses }: { addresses: string[] }) {
  return useQuery({
    enabled: addresses.length > 0,
    queryKey: ['zpi/getWalletsMeta', addresses],
    queryFn: async () => {
      const response = await ZerionAPI.getWalletsMeta({
        identifiers: addresses,
      });
      return response.data;
    },
  });
}
