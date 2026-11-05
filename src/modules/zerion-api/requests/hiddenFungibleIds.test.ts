import { jest } from '@jest/globals';

// Static imports would bind the real HTTP client before the mock is installed.
const post = jest.fn(
  (..._args: unknown[]): Promise<unknown> => Promise.resolve({})
);
const get = jest.fn(
  (..._args: unknown[]): Promise<unknown> => Promise.resolve({})
);

jest.unstable_mockModule('../shared', () => ({
  CLIENT_DEFAULTS: { source: 'mainnet' },
  ZerionHttpClient: { post, get },
}));

const context = {
  getAddressProviderHeader: async () => 'zerion',
  getKyOptions: () => ({}),
};

const hiddenFungibleIds = [
  'usdc',
  '',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'usdc',
];
const normalized = ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'usdc'];

function lastPost() {
  const [options] = post.mock.calls.at(-1) as [
    { endpoint: string; body: string; headers?: Record<string, string> }
  ];
  return { ...options, parsedBody: JSON.parse(options.body) };
}

describe('hiddenFungibleIds on wallet requests', () => {
  beforeEach(() => {
    post.mockClear();
    get.mockClear();
    post.mockResolvedValue({});
    get.mockResolvedValue({});
  });

  test('portfolio sends the normalized list in the JSON body', async () => {
    const { walletGetPortfolio } = await import('./wallet-get-portfolio');
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
    const { walletGetPortfolio } = await import('./wallet-get-portfolio');
    await walletGetPortfolio.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      hiddenFungibleIds: ['', ''],
    });
    expect(lastPost().parsedBody).not.toHaveProperty('hiddenFungibleIds');
  });

  test('grouped positions sends the normalized list', async () => {
    const { walletGetGroupedPositions } = await import(
      './wallet-get-grouped-positions'
    );
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
    const { walletGetChart } = await import('./wallet-get-chart');
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
    const { walletGetPnl } = await import('./wallet-get-pnl');
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
    const { walletGetSimplePositions } = await import(
      './wallet-get-simple-positions'
    );
    await walletGetSimplePositions.call(context, {
      address: '0x0000000000000000000000000000000000000001',
      currency: 'usd',
      hiddenFungibleIds,
    });
    const [options] = get.mock.calls.at(-1) as [{ endpoint: string }];
    const url = new URL(options.endpoint, 'https://example.com');
    expect(url.searchParams.getAll('hiddenFungibleIds')).toEqual(normalized);
  });

  test('simple positions omits the parameter when the effective list is empty', async () => {
    const { walletGetSimplePositions } = await import(
      './wallet-get-simple-positions'
    );
    await walletGetSimplePositions.call(context, {
      address: '0x0000000000000000000000000000000000000001',
      currency: 'usd',
      hiddenFungibleIds: ['', ''],
    });
    const [options] = get.mock.calls.at(-1) as [{ endpoint: string }];
    expect(options.endpoint).not.toContain('hiddenFungibleIds');
  });

  test('501 effective ids are sent in full, never truncated', async () => {
    const ids = Array.from({ length: 501 }, (_, index) => `token-${index}`);
    const { walletGetPortfolio } = await import('./wallet-get-portfolio');
    await walletGetPortfolio.call(context, {
      addresses: ['0x0000000000000000000000000000000000000001'],
      currency: 'usd',
      hiddenFungibleIds: ids,
    });
    expect(lastPost().parsedBody.hiddenFungibleIds).toHaveLength(501);
  });
});
