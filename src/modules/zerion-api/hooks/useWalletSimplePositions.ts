import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { useConfidentialPermits } from 'src/ui/features/confidential-balances/useConfidentialPermits';
import { withPermits } from 'src/ui/features/confidential-balances/withPermits';
import { ZerionAPI } from '../zerion-api.client';
import type { Params } from '../requests/wallet-get-simple-positions';
import type { BackendSourceParams } from '../shared';

const QUERY_KEY = 'walletGetSimplePositions';
const STALE_TIME = 20000;

export function useWalletSimplePositions(
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
  const { permits, fingerprint, isReady } = useConfidentialPermits([
    params.address,
  ]);
  return useQuery({
    // the permits fingerprint stands in for `permits` in the key: signatures themselves never go into a (persisted) query key
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: persistentQuery([QUERY_KEY, params, source, fingerprint]),
    queryFn: () =>
      withPermits(permits, (permits) =>
        ZerionAPI.walletGetSimplePositions({ ...params, permits }, { source })
      ),
    suspense,
    enabled: enabled && isReady,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
  });
}
