import type { SignedPermit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';

/**
 * A Signed Permit as stored on the wallet entry inside the encrypted
 * WalletRecord (see ADR-0006). The two extra fields never leave the client:
 * `chain` is for display and dev tooling, `signedAt` starts the local
 * 30-day lifetime.
 */
export interface StoredPermit extends SignedPermit {
  /** Chain the permit covers — for display and dev tooling only, never sent */
  chain: string;
  /** Local signing timestamp in ms; the 30-day lifetime counts from here */
  signedAt: number;
}
