import { useQuery } from 'react-query';
import { fetchGasPrice } from 'src/modules/ethereum/transactions/gasPrices/requests';
import type { Chain } from 'src/modules/networks/Chain';
import { networksStore } from 'src/modules/networks/networks-store.client';

export function useGasPrices(chain: Chain | null) {
  return useQuery(
    ['defi-sdk/gasPrices', chain?.toString()],
    async () => {
      if (!chain) {
        return null;
      }
      const networks = await networksStore.load();
      return fetchGasPrice(chain, networks);
    },
    { useErrorBoundary: true, enabled: Boolean(chain) }
  );
}