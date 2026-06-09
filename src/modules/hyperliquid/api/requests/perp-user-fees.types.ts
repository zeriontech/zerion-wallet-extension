export interface PerpUserFees {
  userCrossRate: string;
  userAddRate?: string;
  activeReferralDiscount?: string;
  activeStakingDiscount?: { bpsOfMaxSupply?: string; discount?: string };
  trial?: unknown;
  feeSchedule?: unknown;
  feeTrial?: unknown;
  nextTrialAvailableTimestamp?: number | null;
  dailyUserVlm?: unknown[];
}

export interface PerpUserFeesPayload {
  address: string;
}
