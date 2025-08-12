// Shared event types for analytics

export type ButtonScope = 'General' | 'Loaylty' | 'Premium';
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
