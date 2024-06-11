import { useQuery } from '@tanstack/react-query';
import { fetchGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { Chain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store.client';
import { queryClient } from './queryClient';

const QUERY_NAME = 'defi-sdk/gasPrices';

export function queryGasPrices(chain: Chain) {
  return queryClient.fetchQuery({
    queryKey: [QUERY_NAME, chain],
    queryFn: async () => {
      const networks = await networksStore.load([chain.toString()]);
      return fetchGasPrice(chain, networks);
    },
    staleTime: 10000,
  });
}

export function useGasPrices(chain: Chain | null, { suspense = false } = {}) {
  return useQuery({
    queryKey: [QUERY_NAME, chain],
    queryFn: async () => {
      if (!chain) {
        return null;
      }
      const networks = await networksStore.load([chain.toString()]);
      return fetchGasPrice(chain, networks);
    },
    useErrorBoundary: true,
    enabled: Boolean(chain),
    suspense,
    staleTime: 10000,
  });
}
