import { QueryClient } from '@tanstack/react-query';
import { emitter } from '../events';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      suspense: true,
    },
    mutations: {
      networkMode: 'always',
      onError(error, variables, context) {
        emitter.emit('mutationError', error, variables, context);
      },
    },
  },
});

emitter.on('uiAccountsChanged', () => {
  queryClient.removeQueries({
    queryKey: ['wallet/getCurrentAddress'],
  });
  queryClient.removeQueries({
    queryKey: ['wallet/uiGetCurrentWallet'],
  });
});

emitter.on('sidepanel/activeTabUpdated', () => {
  queryClient.refetchQueries(['activeTab/origin']);
});

emitter.on('ethereumEvent', () => {
  queryClient.refetchQueries(['requestChainForOrigin']);
});

emitter.on('sessionLogout', () => {
  queryClient.getMutationCache().clear();
  queryClient.removeQueries();
});
