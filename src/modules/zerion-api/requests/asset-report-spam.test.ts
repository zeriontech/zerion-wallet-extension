import { jest } from '@jest/globals';

// Static imports would bind the real HTTP client before the mock is installed.
const post = jest.fn(
  (..._args: unknown[]): Promise<unknown> => Promise.resolve({})
);

jest.unstable_mockModule('../shared', () => ({
  CLIENT_DEFAULTS: { source: 'mainnet' },
  ZerionHttpClient: { post },
}));

const context = {
  getAddressProviderHeader: async () => 'zerion',
  getKyOptions: () => ({}),
};

function lastBody() {
  const [options] = post.mock.calls.at(-1) as [{ body: string }];
  return JSON.parse(options.body);
}

describe('assetReportSpam', () => {
  beforeEach(() => {
    post.mockClear();
  });

  test('reports the asset and the wallet it was hidden from', async () => {
    const { assetReportSpam } = await import('./asset-report-spam');
    await assetReportSpam.call(context, {
      assetId: 'eth',
      wallet: '0x0000000000000000000000000000000000000001',
    });
    expect(lastBody()).toEqual({
      assetId: 'eth',
      wallet: '0x0000000000000000000000000000000000000001',
    });
  });

  test('omits an empty wallet', async () => {
    const { assetReportSpam } = await import('./asset-report-spam');
    await assetReportSpam.call(context, { assetId: 'eth', wallet: '' });
    expect(lastBody()).toEqual({ assetId: 'eth' });
  });
});
