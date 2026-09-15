import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import {
  getConfidentialPermits,
  useConfidentialPermits,
} from 'src/ui/features/confidential-balances/useConfidentialPermits';
import { withPermits } from 'src/ui/features/confidential-balances/withPermits';
import { getPermitsFingerprint } from 'src/shared/confidential-balances/permits';
import { ZerionAPI } from '../zerion-api.client';
import {
  toAddressPositions,
  type Params as WalletGetPositionsParams,
} from '../requests/wallet-get-positions';
import type { SignedPermit } from '../requests/wallet-prepare-permits';
import type { BackendSourceParams } from '../shared';

const QUERY_KEY = 'walletGetPositions';
const STALE_TIME = 20000;
const queryFn = async (
  params: WalletGetPositionsParams,
  clientParams: BackendSourceParams,
  permits: SignedPermit[]
) => {
  const response = await withPermits(permits, (permits) =>
    ZerionAPI.walletGetPositions({ ...params, permits }, clientParams)
  );
  return toAddressPositions(response);
};

export async function queryHttpAddressPositions(
  params: WalletGetPositionsParams,
  clientParams: BackendSourceParams
) {
  const permits = await getConfidentialPermits(params.addresses);
  return queryClient.fetchQuery({
    queryKey: persistentQuery([
      QUERY_KEY,
      params,
      clientParams,
      getPermitsFingerprint(permits),
    ]),
    queryFn: () => queryFn(params, clientParams, permits),
    staleTime: STALE_TIME,
  });
}

/**
 * NOTE:
 * This helper is an adapter for code that relied on {useAddressPositions} from defi-sdk
 * TODO:
 * Write and use `useWalletPositions` everywhere instead and remove this helper
 */
export function useHttpAddressPositions(
  params: WalletGetPositionsParams,
  clientParams: BackendSourceParams,
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
    queryKey: persistentQuery([QUERY_KEY, params, clientParams, fingerprint]),
    queryFn: () => queryFn(params, clientParams, permits),
    suspense,
    enabled: enabled && isReady,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
  });
}
