// Shared event types for analytics

export type ButtonScope = 'General' | 'Loaylty' | 'General';
export type ButtonName =
  | 'Claim XP'
  | 'Rewards'
  | 'Invite Friends'
  | 'Rate Tooltip'
  | 'Quote List Bottom Description'
  | 'Premium Features'
  | 'Buy Premium';

export interface ButtonClickedParams {
  pathname: string;
  buttonScope: ButtonScope;
  buttonName: ButtonName;
  walletAddress?: string;
}

export type BannerName = 'Buy Premium';

export interface BannerClickedParams {
  pathname: string;
  bannerName: BannerName;
  walletAddress?: string;
}
