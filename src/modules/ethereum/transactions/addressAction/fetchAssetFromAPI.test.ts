import { jest } from '@jest/globals';
import type { Fungible } from 'src/modules/zerion-api/types/Fungible';

// The real client transitively imports the extension runtime, and the http
// client reads package.json, which ESM jest cannot import by name
jest.unstable_mockModule('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { assetListFungibles: jest.fn() },
}));
jest.unstable_mockModule('src/shared/packageVersion', () => ({
  version: 'test',
  productionVersion: 'test',
}));
const { ZerionAPI } = await import('src/modules/zerion-api/zerion-api.client');
const { fetchAssetFromAPI } = await import('./fetchAssetFromAPI');

function fungible(id: string, implementationAddress: string | null = id) {
  return {
    id,
    name: id,
    symbol: id,
    iconUrl: null,
    verified: true,
    new: false,
    implementations: {
      ethereum: { address: implementationAddress, decimals: 18 },
    },
    meta: { price: 1 },
  } as unknown as Fungible;
}

const listFungibles = jest.mocked(ZerionAPI.assetListFungibles);

function mockListFungibles(
  impl: (fungibleIds: string[]) => Promise<{ data: Fungible[] }>
) {
  listFungibles.mockImplementation(((params: { fungibleIds?: string[] }) =>
    impl(params.fungibleIds ?? [])) as unknown as typeof listFungibles);
  return listFungibles;
}

const token = (index: number) => `0x${index.toString(16).padStart(40, '0')}`;

beforeEach(() => {
  listFungibles.mockReset();
});

test('lookups started in the same tick share one request', async () => {
  const spy = mockListFungibles(async (ids) => ({
    data: ids.map((id) => fungible(id)),
  }));
  const ids = [token(1), token(2), token(3)];
  const results = await Promise.all(
    Array.from({ length: 600 }, (_, index) =>
      fetchAssetFromAPI(
        { isNative: false, address: ids[index % ids.length], currency: 'usd' },
        'mainnet'
      )
    )
  );
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0].fungibleIds).toEqual(ids);
  expect(results.map((asset) => asset?.id)).toEqual(
    Array.from({ length: 600 }, (_, index) => ids[index % ids.length])
  );
});

test('many unique ids are split into bounded requests', async () => {
  const spy = mockListFungibles(async (ids) => ({
    data: ids.map((id) => fungible(id)),
  }));
  await Promise.all(
    Array.from({ length: 120 }, (_, index) =>
      fetchAssetFromAPI(
        { isNative: false, address: token(index), currency: 'usd' },
        'mainnet'
      )
    )
  );
  expect(spy.mock.calls.map(([params]) => params.fungibleIds?.length)).toEqual([
    50, 50, 20,
  ]);
});

test('an implementation address resolves to its canonical fungible', async () => {
  mockListFungibles(async () => ({
    data: [fungible('canonical-id', token(7))],
  }));
  const asset = await fetchAssetFromAPI(
    {
      isNative: false,
      address: `0x${token(7).slice(2).toUpperCase()}`,
      currency: 'usd',
    },
    'mainnet'
  );
  expect(asset?.id).toBe('canonical-id');
});

test('a missing fungible resolves to null without failing the others', async () => {
  mockListFungibles(async () => ({ data: [fungible(token(1))] }));
  const [found, missing] = await Promise.all([
    fetchAssetFromAPI(
      { isNative: false, address: token(1), currency: 'usd' },
      'mainnet'
    ),
    fetchAssetFromAPI(
      { isNative: false, address: token(2), currency: 'usd' },
      'mainnet'
    ),
  ]);
  expect(found?.id).toBe(token(1));
  expect(missing).toBeNull();
});

test('a failed request rejects only the lookups it carried', async () => {
  mockListFungibles(async (ids) => {
    if (ids.includes(token(0))) {
      throw new Error('ERR_INSUFFICIENT_RESOURCES');
    }
    return { data: ids.map((id) => fungible(id)) };
  });
  const results = await Promise.allSettled(
    Array.from({ length: 60 }, (_, index) =>
      fetchAssetFromAPI(
        { isNative: false, address: token(index), currency: 'usd' },
        'mainnet'
      )
    )
  );
  const statuses = results.map((result) => result.status);
  expect(statuses.slice(0, 50).every((s) => s === 'rejected')).toBe(true);
  expect(statuses.slice(50).every((s) => s === 'fulfilled')).toBe(true);
});
