import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { emitter } from 'src/ui/shared/events';
import { getNetworksBySearch } from '../ethereum/chains/requests';
import type { ChainId } from '../ethereum/transactions/ChainId';
import { networksStore } from './networks-store.client';

export function useNetworks(chainIds?: string[]) {
  const { data: networks = null, ...query } = useQuery({
    queryKey: ['loadNetworks', chainIds],
    queryFn: () => networksStore.load(chainIds),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    suspense: false,
    useErrorBoundary: true,
  });

  useEffect(() => {
    networksStore.on('change', ({ networks }) => {
      if (networks) {
        queryClient.setQueryData(['loadNetworks', chainIds], networks);
      }
    });
  }, [chainIds]);

  return {
    networks,
    ...query,
    loadNetworkByChainId: useCallback(
      (chainId: ChainId) => networksStore.loadNetworksWithChainId(chainId),
      []
    ),
  };
}

export function useSearchNetworks({ query = '' }: { query?: string }) {
  const { data: queryData, ...queryResult } = useQuery({
    queryKey: ['getNetworksBySearch', query],
    queryFn: () => getNetworksBySearch({ query: query.trim().toLowerCase() }),
    suspense: false,
    keepPreviousData: true,
    onSuccess(results) {
      emitter.emit('networksSearchResponse', query, results.length);
    },
  });
  const { networks } = useNetworks();
  useEffect(() => {
    if (queryData) {
      networksStore.pushConfigs(...queryData);
    }
  }, [queryData]);
  return { networks, ...queryResult };
}
