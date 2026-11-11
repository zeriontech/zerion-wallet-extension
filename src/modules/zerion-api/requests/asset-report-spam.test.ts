import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { assetReportSpam } from './asset-report-spam';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('../shared', () => ({
  CLIENT_DEFAULTS: { source: 'mainnet' },
  ZerionHttpClient: { post: mocks.post },
}));

const context = {
  getAddressProviderHeader: async () => 'zerion',
  getKyOptions: () => ({}),
};

function lastBody() {
  const [options] = mocks.post.mock.calls.at(-1) as [{ body: string }];
  return JSON.parse(options.body);
}

describe('assetReportSpam', () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.post.mockResolvedValue({});
  });

  test('reports the asset and the wallet it was hidden from', async () => {
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
    await assetReportSpam.call(context, { assetId: 'eth', wallet: '' });
    expect(lastBody()).toEqual({ assetId: 'eth' });
  });
});
