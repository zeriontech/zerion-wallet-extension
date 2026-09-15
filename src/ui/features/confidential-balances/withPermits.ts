import { HTTPError } from 'ky';
import type { SignedPermit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import { walletPort } from 'src/ui/shared/channels';
import { invalidateConfidentialPermits } from './useConfidentialPermits';

function isUnauthorized(error: unknown) {
  return error instanceof HTTPError && error.response.status === 401;
}

/**
 * Runs a request with the wallets' Signed Permits attached (body or header,
 * the request decides). A 401 means the backend refused a permit (bad or
 * expired): the permits of every wallet that was attached are dropped from
 * the record and the request is retried once without them — the amounts
 * simply come back encrypted and the Reveal entry points re-surface.
 */
export async function withPermits<T>(
  permits: SignedPermit[],
  request: (permits: SignedPermit[] | undefined) => Promise<T>
): Promise<T> {
  if (permits.length === 0) {
    return request(undefined);
  }
  try {
    return await request(permits);
  } catch (error) {
    if (!isUnauthorized(error)) {
      throw error;
    }
    const addresses = new Set(permits.map((permit) => permit.address));
    await Promise.all(
      Array.from(addresses).map((address) =>
        walletPort.request('clearConfidentialPermits', { address })
      )
    );
    invalidateConfidentialPermits();
    return request(undefined);
  }
}
