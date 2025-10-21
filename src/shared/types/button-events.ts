// Shared event types for analytics

export type ButtonScope = 'General' | 'Loaylty';
export type ButtonName =
  | 'Claim XP'
  | 'Rewards'
  | 'Invite Friends'
  | 'Rate Tooltip'
  | 'Quote List Bottom Description'
  | 'Premium Features'
  | 'Buy Crypto'
  | 'Receive Crypto'
  | 'Buy Premium';

export interface ButtonClickedParams {
  pathname: string;
  buttonScope: ButtonScope;
  buttonName: ButtonName;
  walletAddress?: string;
}

export type BannerName = 'Buy Premium' | 'Get started';
type BannerType = 'Fund_wallet';
type BannerSource = 'Internal';

export interface BannerClickedParams {
  pathname: string;
  bannerName: BannerName;
  bannerType?: BannerType;
  bannerSource?: BannerSource;
  walletAddress?: string;
}
