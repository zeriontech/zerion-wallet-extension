import { QueryCache, QueryClient } from 'react-query';
import { queryServicePort } from '../../channels';
import { emitter } from '../../events';

const queryCache = new QueryCache({
  onSuccess: (data, query) => {
    if (query.options.meta?.cache) {
      queryServicePort.request('setQuery', {
        key: query.queryKey,
        value: data,
      });
    }
  },
});

export const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      suspense: true,
    },
    mutations: {
      onError(error, variables, context) {
        emitter.emit('mutationError', error, variables, context);
      },
    },
  },
});

emitter.on('uiAccountsChanged', () => {
  queryClient.removeQueries({ queryKey: 'wallet/getCurrentAddress' });
  queryClient.removeQueries({ queryKey: 'wallet/uiGetCurrentWallet' });
});

emitter.on('sessionLogout', () => {
  queryClient.getMutationCache().clear();
  queryClient.removeQueries();
});

export async function initQueryCache() {
  const cache = await queryServicePort.request('getAll');
  Object.entries(cache).forEach(([key, value]) => {
    queryClient.setQueryData(JSON.parse(key), value);
  });
}
