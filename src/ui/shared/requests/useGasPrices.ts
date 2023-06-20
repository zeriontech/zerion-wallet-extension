import { useQuery } from '@tanstack/react-query';
import { fetchGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { Chain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { queryClient } from './queryClient';

const queryName = 'defi-sdk/gasPrices';

export function queryGasPrices(chain: Chain) {
  return queryClient.fetchQuery({
    queryKey: [queryName, chain],
    queryFn: async () => {
      const networks = await networksStore.load();
      return fetchGasPrice(chain, networks);
    },
  });
}

export function useGasPrices(chain: Chain | null) {
  return useQuery({
    queryKey: [queryName, chain],
    queryFn: async () => {
      if (!chain) {
        return null;
      }
      const networks = await networksStore.load();
      return fetchGasPrice(chain, networks);
    },
    useErrorBoundary: true,
    enabled: Boolean(chain),
    suspense: false,
  });
}
