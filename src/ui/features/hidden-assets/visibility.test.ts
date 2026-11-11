import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import type { AssetVisibilityChangedParams } from 'src/shared/types/asset-events';
import { reportAssetSpam, trackAssetVisibilityChanged } from './visibility';

const mocks = vi.hoisted(() => ({
  assetReportSpam: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { assetReportSpam: mocks.assetReportSpam },
}));
vi.mock('src/ui/shared/events', () => ({ emitter: { emit: mocks.emit } }));

describe('hidden asset visibility side effects', () => {
  beforeEach(() => {
    mocks.assetReportSpam.mockReset();
    mocks.assetReportSpam.mockResolvedValue(undefined);
    mocks.emit.mockReset();
  });

  test('reports spam with the wallet and ignores a failed report', async () => {
    mocks.assetReportSpam.mockRejectedValueOnce(new Error('offline'));
    reportAssetSpam('eth', '0x0000000000000000000000000000000000000001');
    expect(mocks.assetReportSpam).toHaveBeenCalledWith({
      assetId: 'eth',
      wallet: '0x0000000000000000000000000000000000000001',
    });
    await Promise.resolve();
  });

  test('omits an empty wallet from the report', () => {
    reportAssetSpam('eth');
    expect(mocks.assetReportSpam).toHaveBeenCalledWith({ assetId: 'eth' });
  });

  test('forwards the visibility event payload unchanged', () => {
    const params: AssetVisibilityChangedParams = {
      isHidden: true,
      assetId: 'eth',
      assetName: 'Ethereum',
      assetSymbol: 'ETH',
      entryPoint: 'menu',
      screenName: 'Asset',
      walletAddress: '0x0000000000000000000000000000000000000001',
      hiddenAssetsCount: 3,
    };
    trackAssetVisibilityChanged(params);
    expect(mocks.emit).toHaveBeenCalledWith('assetVisibilityChanged', params);
  });
});
