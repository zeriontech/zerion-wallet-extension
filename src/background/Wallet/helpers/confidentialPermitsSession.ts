import { SessionStorage } from 'src/background/webapis/storage';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import type { StoredPermit } from 'src/shared/types/ConfidentialPermit';

/**
 * The single home of Signed Permits (Confidential Balances), see ADR-0007.
 * They are not part of the WalletRecord: like the unlock credentials they
 * live in `storage.session`, which survives service worker restarts, is wiped
 * when the browser closes, and is cleared explicitly on lock / logout
 * (`Account.removeCredentials`) and when the wallet is removed from every
 * group (`Wallet.removeAddress`). Keyed by normalized address.
 */
export const confidentialPermitsSessionKey = 'confidentialPermits';

export type PermitsByAddress = Record<string, StoredPermit[]>;

export async function readSessionPermits(): Promise<PermitsByAddress> {
  return (
    (await SessionStorage.get<PermitsByAddress>(
      confidentialPermitsSessionKey
    )) ?? {}
  );
}

export async function writeSessionPermits(
  address: string,
  permits: StoredPermit[]
) {
  const all = await readSessionPermits();
  const key = normalizeAddress(address);
  if (permits.length) {
    all[key] = permits;
  } else {
    delete all[key];
  }
  await SessionStorage.set(confidentialPermitsSessionKey, all);
}

export async function removeSessionPermits(addresses: string | string[]) {
  const all = await readSessionPermits();
  const keys = (Array.isArray(addresses) ? addresses : [addresses])
    .map(normalizeAddress)
    .filter((key) => key in all);
  if (keys.length) {
    for (const key of keys) {
      delete all[key];
    }
    await SessionStorage.set(confidentialPermitsSessionKey, all);
  }
}

export async function clearSessionPermits() {
  await SessionStorage.remove(confidentialPermitsSessionKey);
}
