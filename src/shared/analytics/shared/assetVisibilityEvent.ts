import type { AssetVisibilityChangedParams } from 'src/shared/types/asset-events';

/**
 * iOS parity for the Mixpanel payload. `wallet_provider` is added by the
 * background `createParams` wrapper from the wallet address; `wallet_address`
 * itself is stripped before sending.
 */
export function getAssetVisibilityEvent(data: AssetVisibilityChangedParams) {
  return {
    event: data.isHidden ? 'General: Asset Hidden' : 'General: Asset Unhidden',
    properties: {
      asset_id: data.assetId,
      asset_name: data.assetName,
      asset_symbol: data.assetSymbol,
      entry_point: data.entryPoint,
      screen_name: data.screenName,
      hidden_assets_count: data.hiddenAssetsCount,
    },
  };
}
