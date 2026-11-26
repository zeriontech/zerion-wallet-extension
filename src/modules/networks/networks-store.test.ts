import type { ZerionApiClient } from 'src/modules/zerion-api/zerion-api-bare';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import type { EthereumChainConfig } from '../ethereum/chains/types';
import { toNetworkInfo } from './helpers';

vi.mock('ky', () => ({
  HTTPError: class HTTPError extends Error {},
}));
const { networksFallbackInfo } = await import('./networks-fallback');
const { NetworksStore } = await import('./networks-store');

function createStore(pinnedChains: string[], ethereumChainConfigs: EthereumChainConfig[] = []) {
  const searchQueries: string[] = [];
  const calls = { chainList: 0 };
  let failSearches = false;
  const chainGet = vi.fn();
  const apiClient = {
    chainList: async (params: { supportedOnly?: boolean; searchQuery?: string }) => {
      calls.chainList += 1;
      if (params.searchQuery) {
        searchQueries.push(params.searchQuery);
        if (failSearches) {
          throw new Error('backend down');
        }
        return { data: [] };
      }
      return { data: networksFallbackInfo };
    },
    chainGet,
  } as unknown as ZerionApiClient;
  const store = new NetworksStore(
    { networks: null },
    {
      getOtherNetworkData: async () => ({
        ethereumChainConfigs: [...ethereumChainConfigs],
        visitedChains: [],
        pinnedChains: [...pinnedChains],
      }),
      getApiClient: () => apiClient,
      source: 'mainnet',
    },
  );
  return {
    store,
    searchQueries,
    calls,
    chainGet,
    setFailSearches: (value: boolean) => {
      failSearches = value;
    },
  };
}

test('a slug the backend does not know is searched once per session', async () => {
  const { store, calls, searchQueries } = createStore(['gone-chain']);
  await store.load();
  expect(searchQueries).toEqual(['gone-chain']);
  await store.load({ chains: ['gone-chain'] });
  await store.load({ chains: ['gone-chain'] });
  expect(searchQueries).toEqual(['gone-chain']);
  expect(calls.chainList).toBe(2);
});

test('updating pins keeps loaded metadata and leaves failed lookups for explicit loads', async () => {
  const pins = ['gone-chain'];
  const { store, calls, searchQueries, setFailSearches } = createStore(pins);
  setFailSearches(true);
  await store.load();
  expect(searchQueries).toEqual(['gone-chain']);
  setFailSearches(false);
  pins.unshift('ethereum');
  await store.update();
  expect(calls.chainList).toBe(2);
  expect(
    store
      .getState()
      .networks?.getPinnedNetworks()
      .map(({ id }) => id),
  ).toEqual(['ethereum']);

  await store.load({ chains: ['gone-chain'] });
  expect(searchQueries).toEqual(['gone-chain', 'gone-chain']);
});

test('saving a network is local but an explicit lookup can still load backend metadata', async () => {
  const configs: EthereumChainConfig[] = [];
  const { store, chainGet } = createStore([], configs);
  await store.load();

  const id = 'lesser-chain';
  const value = {
    chainId: '0x27bc86aa',
    chainName: 'Custom name',
    nativeCurrency: { name: 'Example', symbol: 'EXM', decimals: 18 },
    rpcUrls: ['https://rpc.example.com'],
  };
  configs.push({ id, value, origin: 'test', created: 0, updated: 0, previousIds: null });
  const network = toNetworkInfo(value, id);
  chainGet.mockResolvedValue({
    data: {
      ...network,
      name: 'Backend name',
      flags: { ...network.flags, supportsPositions: true },
    },
  });

  await store.update();
  const chainId = normalizeChainId(value.chainId);
  expect(chainGet).not.toHaveBeenCalled();
  expect(store.getState().networks?.getNetworkById(chainId).flags.supportsPositions).toBe(false);

  const loaded = await store.loadNetworksByChainId(chainId);
  expect(loaded.getNetworkById(chainId).flags.supportsPositions).toBe(true);
  expect(loaded.getNetworkById(chainId).name).toBe(value.chainName);
});

test('update() on a store that was never loaded makes no requests', async () => {
  const { store, searchQueries, calls } = createStore(['gone-chain']);
  await store.update();
  expect(calls.chainList).toBe(0);
  expect(store.getState().networks).toBeNull();
  await store.load();
  expect(searchQueries).toEqual(['gone-chain']);
  expect(calls.chainList).toBe(2);
});
