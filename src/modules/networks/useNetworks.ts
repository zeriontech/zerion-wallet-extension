import { useSelectorStore } from '@store-unit/react';
import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useErrorBoundary } from 'src/ui/shared/useErrorBoundary';
import { emitter } from 'src/ui/shared/events';
import { getNetworksBySearch } from '../ethereum/chains/requests';
import { networksStore } from './networks-store.client';

export function useNetworks(chainIds?: string[]) {
  const showErrorBoundary = useErrorBoundary();
  useEffect(() => {
    networksStore.load(chainIds).catch((error) => {
      showErrorBoundary(error);
    });
  }, [showErrorBoundary, chainIds]);
  const { networks } = useSelectorStore(networksStore, ['networks']);
  return {
    networks,
    loadNetworkByChainId: useCallback(
      (chainId: number) => networksStore.loadNetworksWithChainId(chainId),
      []
    ),
  };
}

export function useSearchNetworks({ query = '' }: { query?: string }) {
  const { data: itemsForQuery, ...queryResult } = useQuery({
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
    if (itemsForQuery) {
      networksStore.pushConfigs(...itemsForQuery);
    }
  }, [itemsForQuery]);
  return { networks, itemsForQuery, ...queryResult };
}
