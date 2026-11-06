export type AssetVisibilityEntryPoint =
  | 'menu'
  | 'hint'
  | 'long_press'
  | 'banner'
  | 'list';

export type AssetVisibilityScreenName =
  | 'Asset'
  | 'Overview'
  | 'All assets'
  | 'Hidden Assets';

export interface AssetVisibilityChangedParams {
  isHidden: boolean;
  assetId: string;
  assetName?: string | null;
  assetSymbol?: string | null;
  entryPoint: AssetVisibilityEntryPoint;
  screenName: AssetVisibilityScreenName;
  walletAddress?: string;
  /** Effective hidden list size after the change. */
  hiddenAssetsCount: number;
}
