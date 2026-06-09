export interface PerpReferralReferredBy {
  referrer: string;
  code: string;
}

export interface PerpReferral {
  referredBy: PerpReferralReferredBy | null;
  cumVlm?: string;
  unclaimedRewards?: string;
  claimedRewards?: string;
  builderRewards?: string;
  rewardHistory?: unknown[];
  referrerState?: unknown;
}

export interface PerpReferralPayload {
  address: string;
}
