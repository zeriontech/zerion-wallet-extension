import { useQuery } from '@tanstack/react-query';
import { fetchGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import { type Chain } from 'src/modules/networks/Chain';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import {
  getPreferences,
  usePreferences,
} from 'src/ui/features/preferences/usePreferences';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { useNetworkConfig } from 'src/modules/networks/useNetworks';
import { queryClient } from './queryClient';

const QUERY_NAME = 'defi-sdk/gasPrices';

export async function queryGasPrices(chain: Chain) {
  const preferences = await getPreferences();
  const source = preferences.testnetMode?.on ? 'testnet' : 'mainnet';
  return queryClient.fetchQuery({
    queryKey: [QUERY_NAME, chain, source],
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const network = await networksStore.fetchNetworkById(chain.toString());
      return fetchGasPrice({ network, source, apiClient: ZerionAPI });
    },
    staleTime: 10000,
  });
}

export function useGasPrices(chain: Chain | null, { suspense = false } = {}) {
  const { preferences } = usePreferences();
  const source = preferences?.testnetMode?.on ? 'testnet' : 'mainnet';
  const { data: network } = useNetworkConfig(chain?.toString() ?? null);
  return useQuery({
    queryKey: [QUERY_NAME, source, network],
    queryFn: async () => {
      if (!network) {
        return null;
      }
      return fetchGasPrice({ network, source, apiClient: ZerionAPI });
    },
    useErrorBoundary: true,
    enabled: Boolean(network && network.standard === 'eip155'),
    suspense,
    staleTime: 10000,
  });
}
