// Shared event types for analytics

export type ButtonScope = 'Loaylty';
export type ButtonName = 'Claim XP' | 'Rewards' | 'Invite Friends';

export interface ButtonClickedParams {
  location: string;
  buttonScope: ButtonScope;
  buttonName: ButtonName;
}
