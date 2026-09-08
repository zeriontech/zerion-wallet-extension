import { normalizeAddress } from 'src/shared/normalizeAddress';

export type ReceiverFamiliarity = 'known' | 'unknown';

function includesAddress(addresses: string[], normalizedTo: string): boolean {
  return addresses.some(
    (address) => normalizeAddress(address) === normalizedTo
  );
}

/**
 * Decides whether the user has a prior relationship with a receiver address.
 * A receiver is `known` when it appears in My wallets, the Watchlist, or the
 * Address Book; anything else is an **Unknown receiver** and warrants an extra
 * confirmation before signing.
 *
 * Recent addresses deliberately do NOT count. `recentAddresses` is written on
 * every successful broadcast, so treating a recent as known would give the
 * confirmation exactly one chance per address — a second send to a mistyped
 * address would go through unchallenged.
 *
 * The rule fails **closed**: empty lists (what the caller holds while the
 * wallet-groups query and preferences are still loading) match nothing, so the
 * receiver reads as `unknown` and the user is asked to confirm. This is the
 * opposite of `useReadonlyReceiverGate`, which needs its query resolved before
 * it warns. See ADR-0005.
 */
export function resolveReceiverFamiliarity({
  to,
  myWalletAddresses,
  watchlistAddresses,
  addressBookAddresses,
}: {
  to: string | null | undefined;
  myWalletAddresses: string[];
  watchlistAddresses: string[];
  addressBookAddresses: string[];
}): ReceiverFamiliarity {
  if (!to) return 'unknown';
  const normalizedTo = normalizeAddress(to);
  const isKnown =
    includesAddress(myWalletAddresses, normalizedTo) ||
    includesAddress(watchlistAddresses, normalizedTo) ||
    includesAddress(addressBookAddresses, normalizedTo);
  return isKnown ? 'known' : 'unknown';
}
