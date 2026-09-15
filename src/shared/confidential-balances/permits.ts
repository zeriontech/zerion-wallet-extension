import type {
  Permit,
  SignedPermit,
} from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import type { StoredPermit } from 'src/shared/types/ConfidentialPermit';

/** Upper bound on how long a Signed Permit is reused locally: up to 30 days, and never past `expireAt` */
export const PERMIT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
/** Backend cap on permits per request (body or header) */
export const MAX_PERMITS_PER_REQUEST = 10;

function getPermitDeadline(permit: StoredPermit): number {
  const expireAt = Date.parse(permit.expireAt);
  const lifetimeEnd = permit.signedAt + PERMIT_LIFETIME_MS;
  return Number.isNaN(expireAt) ? lifetimeEnd : Math.min(expireAt, lifetimeEnd);
}

export function isPermitValid(permit: StoredPermit, now = Date.now()) {
  return getPermitDeadline(permit) > now;
}

export function toStoredPermit(
  address: string,
  permit: Permit,
  signature: string,
  signedAt = Date.now()
): StoredPermit {
  return {
    address,
    contracts: permit.contracts,
    expireAt: permit.expireAt,
    signature,
    chain: permit.chain,
    signedAt,
  };
}

export function toSignedPermit(permit: StoredPermit): SignedPermit {
  return {
    address: permit.address,
    contracts: permit.contracts,
    expireAt: permit.expireAt,
    signature: permit.signature,
  };
}

export function getValidPermits(
  permits: StoredPermit[] | null | undefined,
  now = Date.now()
): StoredPermit[] {
  return permits ? permits.filter((permit) => isPermitValid(permit, now)) : [];
}

/**
 * Every valid Signed Permit of the given wallets, in wallet order, cut at the
 * backend cap. The client never picks which permit covers which contract —
 * the server matches them.
 */
export function collectPermitsForRequest(
  permitLists: (StoredPermit[] | null | undefined)[],
  now = Date.now()
): SignedPermit[] {
  const result: SignedPermit[] = [];
  for (const list of permitLists) {
    for (const permit of getValidPermits(list, now)) {
      if (result.length >= MAX_PERMITS_PER_REQUEST) {
        return result;
      }
      result.push(toSignedPermit(permit));
    }
  }
  return result;
}

/**
 * Stable string identifying the permits a request would carry, for query
 * keys: when a permit is signed, dropped or expires the key changes and the
 * data refetches naturally. Never put the signatures themselves in a key.
 */
export function getPermitsFingerprint(
  permits: SignedPermit[] | null | undefined
): string | null {
  return permits?.length
    ? permits.map((permit) => permit.signature.slice(-16)).join(',')
    : null;
}
