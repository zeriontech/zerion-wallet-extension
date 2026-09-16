import type { SignedPermit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';

/**
 * A Signed Permit as stored in the background's storage.session (see
 * ADR-0007). The two extra fields never leave the client:
 * `chain` is for display and dev tooling, `signedAt` starts the local
 * lifetime of up to 30 days.
 */
export interface StoredPermit extends SignedPermit {
  /** Chain the permit covers — for display and dev tooling only, never sent */
  chain: string;
  /** Local signing timestamp in ms; the up-to-30-day lifetime counts from here */
  signedAt: number;
}
