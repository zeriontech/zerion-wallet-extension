import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { useConfidentialPermits } from 'src/ui/features/confidential-balances/useConfidentialPermits';
import { withPermits } from 'src/ui/features/confidential-balances/withPermits';
import { ZerionAPI } from '../zerion-api.client';
import type { Params } from '../requests/wallet-get-grouped-positions';
import type { BackendSourceParams } from '../shared';

const QUERY_KEY = 'walletGetGroupedPositions';
const STALE_TIME = 20000;

/**
 * Grouped Positions for read surfaces (Overview, Stats drill-down, Reveal
 * dialog). Trading surfaces and single-chain balance checks use
 * `useWalletSimplePositions` instead: a grouped row sums an asset across
 * chains and carries no chain-exact amount.
 */
export function useWalletGroupedPositions(
  params: Params,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
    keepPreviousData = false,
    refetchInterval,
  }: {
    suspense?: boolean;
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number | false;
  } = {}
) {
  // Signed Permits are part of the request, so their fingerprint is part of
  // the key: a newly signed (or dropped) permit refetches the positions
  const { permits, fingerprint, isReady } = useConfidentialPermits(
    params.addresses
  );
  return useQuery({
    // the permits fingerprint stands in for `permits` in the key: signatures themselves never go into a (persisted) query key
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: persistentQuery([QUERY_KEY, params, source, fingerprint]),
    queryFn: () =>
      withPermits(permits, (permits) =>
        ZerionAPI.walletGetGroupedPositions({ ...params, permits }, { source })
      ),
    suspense,
    enabled: enabled && isReady && params.addresses.length > 0,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
  });
}
