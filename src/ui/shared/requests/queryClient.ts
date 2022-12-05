import { QueryClient } from 'react-query';
import { emitter } from '../events';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
    },
  },
});

emitter.on('uiAccountsChanged', () => {
  queryClient.removeQueries({ queryKey: 'wallet/getCurrentAddress' });
  queryClient.removeQueries({ queryKey: 'wallet/uiGetCurrentWallet' });
});

emitter.on('sessionLogout', () => {
  queryClient.removeQueries();
});
