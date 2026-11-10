import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { walletGetChart } from './wallet-get-chart';
import { walletGetGroupedPositions } from './wallet-get-grouped-positions';
import { walletGetPnl } from './wallet-get-pnl';
import { walletGetPortfolio } from './wallet-get-portfolio';
import { walletGetSimplePositions } from './wallet-get-simple-positions';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
}));

vi.mock('../shared', () => ({
  CLIENT_DEFAULTS: { source: 'mainnet' },
  ZerionHttpClient: { post: mocks.post, get: mocks.get },
}));

const context = {
  getAddressProviderHeader: async () => 'zerion',
  getKyOptions: () => ({}),
};

const hiddenFungibleIds = ['usdc', '', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'usdc'];
const normalized = ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'usdc'];

function lastPost() {
  const [options] = mocks.post.mock.calls.at(-1) as [
    { endpoint: string; body: string; headers?: Record<string, string> },
  ];
  return { ...options, parsedBody: JSON.parse(options.body) };
}

describe('hiddenFungibleIds on wallet requests', () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.get.mockReset();
    mocks.post.mockResolvedValue({});
    mocks.get.mockResolvedValue({});
  });

  test('portfolio sends the normalized list in the JSON body', async () => {
    await walletGetPortfolio.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      hiddenFungibleIds,
    });
    expect(lastPost()).toMatchObject({
      endpoint: 'wallet/get-portfolio/v1',
      parsedBody: {
        addresses: ['0x0000000000000000000000000000000000000001'],
        currency: 'usd',
        hiddenFungibleIds: normalized,
      },
    });
  });

  test('portfolio omits the field when the effective list is empty', async () => {
    await walletGetPortfolio.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      hiddenFungibleIds: ['', ''],
    });
    expect(lastPost().parsedBody).not.toHaveProperty('hiddenFungibleIds');
  });

  test('grouped positions sends the normalized list', async () => {
    await walletGetGroupedPositions.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      groupBy: ['by-position'],
      hiddenFungibleIds,
    });
    expect(lastPost()).toMatchObject({
      endpoint: 'wallet/get-grouped-positions/v1',
      parsedBody: { hiddenFungibleIds: normalized },
    });
  });

  test('chart sends the normalized list and no other filter field', async () => {
    await walletGetChart.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      period: '1d',
      hiddenFungibleIds,
    });
    expect(lastPost()).toMatchObject({
      endpoint: 'wallet/get-chart/v1',
      parsedBody: { hiddenFungibleIds: normalized },
    });
    expect(lastPost().parsedBody).not.toHaveProperty('hideSmallBalance');
  });

  test('pnl sends the normalized list', async () => {
    await walletGetPnl.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      hiddenFungibleIds,
    });
    expect(lastPost()).toMatchObject({
      endpoint: 'wallet/get-pnl/v1',
      parsedBody: { hiddenFungibleIds: normalized },
    });
  });

  test('simple positions repeats the query key per id and never joins them', async () => {
    await walletGetSimplePositions.call(context, {
      address: '0x0000000000000000000000000000000000000001',
      currency: 'usd',
      hiddenFungibleIds,
    });
    const [options] = mocks.get.mock.calls.at(-1) as [{ endpoint: string }];
    const url = new URL(options.endpoint, 'https://example.com');
    expect(url.searchParams.getAll('hiddenFungibleIds')).toEqual(normalized);
  });

  test('simple positions omits the parameter when the effective list is empty', async () => {
    await walletGetSimplePositions.call(context, {
      address: '0x0000000000000000000000000000000000000001',
      currency: 'usd',
      hiddenFungibleIds: ['', ''],
    });
    const [options] = mocks.get.mock.calls.at(-1) as [{ endpoint: string }];
    expect(options.endpoint).not.toContain('hiddenFungibleIds');
  });

  test('501 effective ids are sent in full, never truncated', async () => {
    const ids = Array.from({ length: 501 }, (_, index) => `token-${index}`);
    await walletGetPortfolio.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      hiddenFungibleIds: ids,
    });
    expect(lastPost().parsedBody.hiddenFungibleIds).toHaveLength(501);
  });
});
