import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { ZerionAPI } from '../zerion-api.client';
import type { Params } from '../requests/wallet-get-portfolio';
import type { BackendSourceParams } from '../shared';

const STALE_TIME = 20000;
const QUERY_KEY = 'walletGetPortfolio';

export function queryWalletPortfolio(
  params: Params,
  clientParams: BackendSourceParams
) {
  return queryClient.fetchQuery({
    queryKey: persistentQuery([QUERY_KEY, params, clientParams]),
    queryFn: () => ZerionAPI.walletGetPortfolio(params, clientParams),
    staleTime: STALE_TIME,
  });
}

export function useWalletPortfolio(
  params: Params,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
    keepPreviousData = false,
    refetchInterval,
    refetchOnWindowFocus = true,
  }: {
    suspense?: boolean;
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: persistentQuery([QUERY_KEY, params, source]),
    queryFn: () => ZerionAPI.walletGetPortfolio(params, { source }),
    retry: 0, // if not 0, there are too many rerenders if the queryFn throws synchronously
    suspense,
    enabled,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
    refetchOnWindowFocus,
  });
}
