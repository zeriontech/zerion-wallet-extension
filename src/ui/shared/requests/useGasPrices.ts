import { useQuery } from '@tanstack/react-query';
import { fetchGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { Chain } from 'src/modules/networks/Chain';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import {
  getPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import { queryClient } from './queryClient';

const QUERY_NAME = 'defi-sdk/gasPrices';

export async function queryGasPrices(chain: Chain) {
  const preferences = await getPreferences();
  const source = preferences.testnetMode?.on ? 'testnet' : 'mainnet';
  return queryClient.fetchQuery({
    queryKey: [QUERY_NAME, chain, source],
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const networks = await networksStore.load({ chains: [chain.toString()] });
      return fetchGasPrice({ chain, networks, source });
    },
    staleTime: 10000,
  });
}

export function useGasPrices(chain: Chain | null, { suspense = false } = {}) {
  const { preferences } = usePreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  return useQuery({
    queryKey: [QUERY_NAME, chain, source],
    queryFn: async () => {
      if (!chain) {
        return null;
      }
      const networksStore = await getNetworksStore();
      const networks = await networksStore.load({ chains: [chain.toString()] });
      return fetchGasPrice({ chain, networks, source });
    },
    useErrorBoundary: true,
    enabled: Boolean(chain),
    suspense,
    staleTime: 10000,
  });
}
