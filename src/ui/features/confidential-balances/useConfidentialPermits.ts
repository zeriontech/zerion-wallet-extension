import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import type { SignedPermit } from 'src/modules/zerion-api/requests/wallet-prepare-permits';
import {
  collectPermitsForRequest,
  getPermitsFingerprint,
} from 'src/shared/confidential-balances/permits';

/**
 * Signed Permits live in the background's storage.session, next to the unlock
 * credentials, not in the WalletRecord (ADR-0007). This is the one query that
 * reads them; every permit-keyed data query derives from it.
 */
function permitsQueryOptions(address: string) {
  return {
    queryKey: ['wallet/uiGetConfidentialPermits', address] as const,
    queryFn: () => walletPort.request('uiGetConfidentialPermits', { address }),
    // permits only change through Reveal, a 401 wipe or lock; never poll
    staleTime: Infinity,
  };
}

/** Raw stored list for one wallet, expired ones included (dev tooling) */
export function useStoredConfidentialPermits(
  address: string | null | undefined
) {
  return useQuery({
    ...permitsQueryOptions(address ?? ''),
    enabled: Boolean(address),
    suspense: false,
  });
}

/** The wallet entry for `address` (masked); used to decide if it can sign */
export function useWalletByAddress(address: string | null | undefined) {
  const safeAddress = address ?? '';
  return useQuery({
    queryKey: ['wallet/uiGetWalletByAddress', safeAddress, null] as const,
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', {
        address: safeAddress,
        groupId: null,
      }),
    // the record only changes through explicit user actions; never poll
    staleTime: Infinity,
    enabled: Boolean(address),
    suspense: false,
  });
}

/**
 * The Signed Permits a request for `addresses` should carry, plus a stable
 * fingerprint for query keys. `isReady` is false until the permits have been
 * read once, so callers can hold the data request instead of firing it
 * without permits and again with them.
 */
export function useConfidentialPermits(addresses: string[]): {
  permits: SignedPermit[];
  fingerprint: string | null;
  isReady: boolean;
} {
  const queries = useQueries({
    queries: addresses
      .filter(Boolean)
      .map((address) => ({ ...permitsQueryOptions(address), suspense: false })),
  });
  const isReady = queries.every((query) => query.isFetched || query.isError);
  const permitLists = queries.map((query) => query.data);
  const fingerprintInput = permitLists
    .map((list) => list?.map((permit) => permit.signature).join('|') ?? '')
    .join(';');
  const permits = useMemo(
    () => collectPermitsForRequest(permitLists),
    // permitLists is a fresh array every render; its content is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fingerprintInput]
  );
  return { permits, fingerprint: getPermitsFingerprint(permits), isReady };
}

/** Imperative twin of `useConfidentialPermits` for non-hook query helpers */
export async function getConfidentialPermits(
  addresses: string[]
): Promise<SignedPermit[]> {
  const permitLists = await Promise.all(
    addresses
      .filter(Boolean)
      .map((address) =>
        queryClient.fetchQuery(permitsQueryOptions(address)).catch(() => null)
      )
  );
  return collectPermitsForRequest(permitLists);
}

/** Call after the stored permits changed so every permit-keyed query refetches */
export function invalidateConfidentialPermits() {
  return queryClient.invalidateQueries({
    queryKey: ['wallet/uiGetConfidentialPermits'],
  });
}
