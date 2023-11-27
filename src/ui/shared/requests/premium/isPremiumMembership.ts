import type { AddressMembership } from 'defi-sdk';

export function isPremiumMembership(info?: AddressMembership | null) {
  return Boolean(
    info?.premium &&
      (info.premium.expiration_time === null ||
        new Date(info.premium.expiration_time).getTime() > Date.now())
  );
}
