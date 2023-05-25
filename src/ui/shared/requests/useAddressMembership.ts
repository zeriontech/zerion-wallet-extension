import type { AddressParams } from 'defi-sdk';
import { createDomainHook, client } from 'defi-sdk';

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
    non_premium_tokens: NonPremiumTokens[];
    balances: MigrationBalances[];
  } | null;
}

export const useAddressMembership = createDomainHook<
  AddressParams,
  MembershipInfo,
  typeof namespace,
  typeof scope
>({ namespace, scope });

export async function getAddressMembership({ address }: { address: string }) {
  return new Promise<MembershipInfo | undefined>((resolve) =>
    client.cachedSubscribe<MembershipInfo, typeof namespace, typeof scope>({
      namespace,
      body: {
        scope: [scope],
        payload: { address },
      },
      onData: (entry) => {
        if (entry.value) {
          resolve(entry.value);
        }
      },
      cachePolicy: 'network-only',
    })
  );
}

export function isMembershipValid(info?: MembershipInfo | null) {
  return Boolean(
    info?.premium &&
      (info.premium.expiration_time === null ||
        new Date(info.premium.expiration_time).getTime() > Date.now())
  );
}
