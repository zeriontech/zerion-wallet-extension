import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
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
  return useQuery({
    queryKey: persistentQuery([QUERY_KEY, params, source]),
    queryFn: () => ZerionAPI.walletGetSimplePositions(params, { source }),
    suspense,
    enabled,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
  });
}
