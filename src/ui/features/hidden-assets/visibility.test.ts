import { jest } from '@jest/globals';
import type { AssetVisibilityChangedParams } from 'src/shared/types/asset-events';

const assetReportSpam = jest.fn(
  (..._args: unknown[]): Promise<unknown> => Promise.resolve({})
);
const emit = jest.fn();

jest.unstable_mockModule('src/modules/zerion-api/zerion-api.client', () => ({
  ZerionAPI: { assetReportSpam },
}));
jest.unstable_mockModule('src/ui/shared/events', () => ({
  emitter: { emit },
}));

const { reportAssetSpam, trackAssetVisibilityChanged } = await import(
  './visibility'
);

describe('hidden asset visibility side effects', () => {
  beforeEach(() => {
    assetReportSpam.mockClear();
    emit.mockClear();
  });

  test('reports spam with the wallet and ignores a failed report', async () => {
    assetReportSpam.mockRejectedValueOnce(new Error('offline'));
    reportAssetSpam('eth', '0x0000000000000000000000000000000000000001');
    expect(assetReportSpam).toHaveBeenCalledWith({
      assetId: 'eth',
      wallet: '0x0000000000000000000000000000000000000001',
    });
    await Promise.resolve();
  });

  test('omits an empty wallet from the report', () => {
    reportAssetSpam('eth');
    expect(assetReportSpam).toHaveBeenCalledWith({ assetId: 'eth' });
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
    expect(emit).toHaveBeenCalledWith('assetVisibilityChanged', params);
  });
});
