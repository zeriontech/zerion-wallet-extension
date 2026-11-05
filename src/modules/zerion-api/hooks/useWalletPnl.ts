import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { useHiddenFungibleIds } from 'src/ui/features/hidden-assets/useHiddenFungibles';
import { ZerionAPI } from '../zerion-api.client';
import type { Params } from '../requests/wallet-get-pnl';
import type { BackendSourceParams } from '../shared';

const STALE_TIME = 20000;
const QUERY_KEY = 'walletGetPnl';

export function queryWalletPnl(params: Params, clientParams: BackendSourceParams) {
  return queryClient.fetchQuery({
    queryKey: persistentQuery([QUERY_KEY, params, clientParams]),
    queryFn: () => ZerionAPI.walletGetPnl(params, clientParams),
    staleTime: STALE_TIME,
  });
}

export function useWalletPnl(
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
  } = {},
) {
  const { hiddenFungibleIds, isReady } = useHiddenFungibleIds();
  const filteredParams = useMemo(
    () => ({ ...params, hiddenFungibleIds }),
    [params, hiddenFungibleIds]
  );
  return useQuery({
    queryKey: persistentQuery([QUERY_KEY, filteredParams, { source }]),
    queryFn: () => ZerionAPI.walletGetPnl(filteredParams, { source }),
    retry: 0, // if not 0, there are too many rerenders if the queryFn throws synchronously
    suspense,
    enabled: enabled && isReady,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
    refetchOnWindowFocus,
  });
}
