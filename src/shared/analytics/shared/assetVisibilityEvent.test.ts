import { getAssetVisibilityEvent } from './assetVisibilityEvent';

describe('getAssetVisibilityEvent', () => {
  test('maps hide to the iOS Mixpanel event and payload', () => {
    expect(
      getAssetVisibilityEvent({
        isHidden: true,
        assetId: 'eth',
        assetName: 'Ethereum',
        assetSymbol: 'ETH',
        entryPoint: 'menu',
        screenName: 'Asset',
        walletAddress: '0x0000000000000000000000000000000000000001',
        hiddenAssetsCount: 3,
      })
    ).toEqual({
      event: 'General: Asset Hidden',
      properties: {
        asset_id: 'eth',
        asset_name: 'Ethereum',
        asset_symbol: 'ETH',
        entry_point: 'menu',
        screen_name: 'Asset',
        hidden_assets_count: 3,
      },
    });
  });

  test('maps unhide to the iOS Mixpanel event', () => {
    expect(
      getAssetVisibilityEvent({
        isHidden: false,
        assetId: 'eth',
        entryPoint: 'list',
        screenName: 'Hidden Assets',
        hiddenAssetsCount: 0,
      })
    ).toEqual({
      event: 'General: Asset Unhidden',
      properties: {
        asset_id: 'eth',
        asset_name: undefined,
        asset_symbol: undefined,
        entry_point: 'list',
        screen_name: 'Hidden Assets',
        hidden_assets_count: 0,
      },
    });
  });
});
