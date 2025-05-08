// Shared event types for analytics

export type ButtonScope = 'General' | 'Loaylty';
export type ButtonName =
  | 'Claim XP'
  | 'Rewards'
  | 'Invite Friends'
  | 'Rate Tooltip'
  | 'Quote List Bottom Description';

export interface ButtonClickedParams {
  pathname: string;
  buttonScope: ButtonScope;
  buttonName: ButtonName;
  walletAddress?: string;
}
