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
 * Signed Permits live on the wallet entry inside the WalletRecord (ADR-0006),
 * so reading them is reading the wallet. `maskWallet` keeps
 * `confidentialPermits` intact, only `privateKey`/`mnemonic` are stripped.
 */
function walletQueryOptions(address: string) {
  return {
    queryKey: ['wallet/uiGetWalletByAddress', address, null] as const,
    queryFn: () =>
      walletPort.request('uiGetWalletByAddress', { address, groupId: null }),
    // the record only changes through explicit user actions; never poll
    staleTime: Infinity,
  };
}

export function useWalletByAddress(address: string | null | undefined) {
  return useQuery({
    ...walletQueryOptions(address ?? ''),
    enabled: Boolean(address),
    suspense: false,
  });
}

/**
 * The Signed Permits a request for `addresses` should carry, plus a stable
 * fingerprint for query keys. `isReady` is false until the wallets have been
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
      .map((address) => ({ ...walletQueryOptions(address), suspense: false })),
  });
  const isReady = queries.every((query) => query.isFetched || query.isError);
  const permitLists = queries.map((query) => query.data?.confidentialPermits);
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
  const wallets = await Promise.all(
    addresses
      .filter(Boolean)
      .map((address) =>
        queryClient.fetchQuery(walletQueryOptions(address)).catch(() => null)
      )
  );
  return collectPermitsForRequest(
    wallets.map((wallet) => wallet?.confidentialPermits)
  );
}

/** Call after the record's permits changed so every permit-keyed query refetches */
export function invalidateConfidentialPermits() {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['wallet/uiGetWalletByAddress'],
    }),
    queryClient.invalidateQueries({ queryKey: ['wallet/uiGetCurrentWallet'] }),
  ]);
}
