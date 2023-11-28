import type { AddressParams } from 'defi-sdk';
import { createDomainHook } from 'defi-sdk';

const namespace = 'address';
const scope = 'membership';

interface NonPremiumTokens {
  generation: 'G1' | 'OnePointO';
  id: string;
}

interface MigrationBalances {
  id: string;
  initial: number;
  remained: number;
}

export interface MigrationToken {
  generation: 'G1' | 'OnePointO';
  id: string;
  premium: {
    expiration_time: string | null;
  };
}

export interface MembershipInfo {
  premium: MigrationToken['premium'] | null;
  tokens: MigrationToken[] | null;
  migration: {
    migration_end_time: string;
    trial_end_time: string;
    non_premium_tokens: NonPremiumTokens[];
    balances: MigrationBalances[];
  } | null;
  claimable_perks?: string[];
}

export const useAddressMembership = createDomainHook<
  AddressParams,
  MembershipInfo,
  typeof namespace,
  typeof scope
>({ namespace, scope });
