import { useCallback, useEffect } from 'react';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { emitter } from 'src/ui/shared/events';
import {
  getNetworksStore,
  mainNetworksStore,
  testenvNetworksStore,
} from 'src/modules/networks/networks-store.client';
import { usePreferences } from 'src/ui/features/preferences';
import { invariant } from 'src/shared/invariant';
import { getNetworksBySearch } from '../ethereum/chains/requests';
import type { ChainId } from '../ethereum/transactions/ChainId';
import { NetworksStore } from './networks-store';
import { createChain } from './Chain';

function useNetworksStore() {
  const { preferences } = usePreferences();
  return !preferences
    ? null
    : preferences.testnetMode?.on
    ? testenvNetworksStore
    : mainNetworksStore;
}

export function useNetworks(chains?: string[]) {
  const networksStore = useNetworksStore();
  const { data: networks = null, ...query } = useQuery({
    queryKey: ['loadNetworks', chains, networksStore],
    queryKeyHashFn: (queryKey) => {
      const stringifiable = queryKey.map((x) =>
        x instanceof NetworksStore ? x.toString() : x
      );
      return hashQueryKey(stringifiable);
    },
    queryFn: () => {
      invariant(networksStore, 'Enable query when networks store is ready');
      return networksStore.load(chains ? { chains } : undefined);
    },
    staleTime: 1000 * 60 * 5,
    suspense: false,
    useErrorBoundary: true,
    enabled: Boolean(networksStore),
  });

  useEffect(() => {
    return networksStore?.on('change', ({ networks }) => {
      if (networks) {
        queryClient.setQueryData(
          ['loadNetworks', chains, networksStore.toString()],
          networks
        );
      }
    });
  }, [chains, networksStore]);

  return {
    networks,
    ...query,
    loadNetworkByChainId: useCallback(
      (chainId: ChainId) => {
        invariant(
          networksStore,
          'networksStore is not ready until preferences are read'
        );
        return networksStore.loadNetworksByChainId(chainId);
      },
      [networksStore]
    ),
  };
}

/**
 * This hook a meant to be used for a special case:
 * When testnetmode is enabled, UI may need to display information for a mainnet network
 */
export function useMainnetNetwork({
  chain: chainStr,
  enabled = true,
}: {
  chain: string;
  enabled?: boolean;
}) {
  return useQuery({
    enabled,
    queryKey: ['getMainnetworkItem', chainStr],
    queryFn: async () => {
      await mainNetworksStore.load({ chains: [chainStr] });
      const network = mainNetworksStore
        .getState()
        .networks?.getNetworkByName(createChain(chainStr));
      return network;
    },
    staleTime: 1000 * 60 * 5,
    suspense: false,
    useErrorBoundary: false,
  });
}

export function useSearchNetworks({ query = '' }: { query?: string }) {
  const { data: queryData, ...queryResult } = useQuery({
    queryKey: ['getNetworksBySearch', query],
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const data = await getNetworksBySearch({
        query: query.trim().toLowerCase(),
        client: networksStore.client,
      });
      networksStore.pushConfigs(...data);
      emitter.emit('networksSearchResponse', query, data.length);
      return data;
    },
    suspense: false,
    keepPreviousData: true,
  });
  const { networks } = useNetworks();
  return { networks, ...queryResult };
}
