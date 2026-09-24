import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';

// ky and store-unit ship ESM only, which jest doesn't transform; the store's
// event API is not exercised here
jest.mock('ky', () => ({ HTTPError: class HTTPError extends Error {} }));
jest.mock('store-unit', () => ({
  Store: class Store<T> {
    private state: T;
    constructor(state: T) {
      this.state = state;
    }
    getState() {
      return this.state;
    }
    setState(next: T | ((state: T) => T)) {
      this.state =
        typeof next === 'function' ? (next as (s: T) => T)(this.state) : next;
    }
    on() {
      return () => {};
    }
  },
}));
import { networksFallbackInfo } from './networks-fallback';
import { NetworksStore } from './networks-store';

function createStore(pinnedChains: string[]) {
  const searchQueries: string[] = [];
  let failSearches = false;
  const apiClient = {
    chainList: async (params: {
      supportedOnly?: boolean;
      searchQuery?: string;
    }) => {
      if (params.searchQuery) {
        searchQueries.push(params.searchQuery);
        if (failSearches) {
          throw new Error('backend down');
        }
        return { data: [] };
      }
      return { data: networksFallbackInfo };
    },
  } as unknown as ZerionApiClient;
  const store = new NetworksStore(
    { networks: null },
    {
      getOtherNetworkData: async () => ({
        ethereumChainConfigs: [],
        visitedChains: [],
        pinnedChains,
      }),
      getApiClient: () => apiClient,
      source: 'mainnet',
    }
  );
  return {
    store,
    searchQueries,
    setFailSearches: (value: boolean) => {
      failSearches = value;
    },
  };
}

test('a slug the backend does not know is searched once per session', async () => {
  const { store, searchQueries } = createStore(['gone-chain']);
  await store.load();
  expect(searchQueries).toEqual(['gone-chain']);
  await store.update();
  await store.update();
  expect(searchQueries).toEqual(['gone-chain']);
});

test('a failed search is retried on the next update', async () => {
  const { store, searchQueries, setFailSearches } = createStore(['gone-chain']);
  setFailSearches(true);
  await store.load();
  expect(searchQueries).toEqual(['gone-chain']);
  setFailSearches(false);
  await store.update();
  expect(searchQueries).toEqual(['gone-chain', 'gone-chain']);
  await store.update();
  expect(searchQueries).toEqual(['gone-chain', 'gone-chain']);
});
