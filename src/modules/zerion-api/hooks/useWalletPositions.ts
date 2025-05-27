import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { ZerionAPI } from '../zerion-api.client';
import {
  toAddressPositions,
  type Params as WalletGetPositionsParams,
} from '../requests/wallet-get-positions';
import type { BackendSourceParams } from '../shared';

const QUERY_KEY = 'walletGetPositions';
const STALE_TIME = 20000;
const queryFn = async (
  params: WalletGetPositionsParams,
  clientParams: BackendSourceParams
) => {
  const response = await ZerionAPI.walletGetPositions(params, clientParams);
  return toAddressPositions(response);
};

export function queryHttpAddressPositions(
  params: WalletGetPositionsParams,
  clientParams: BackendSourceParams
) {
  return queryClient.fetchQuery({
    queryKey: persistentQuery([QUERY_KEY, params, clientParams]),
    queryFn: () => queryFn(params, clientParams),
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
  return useQuery({
    queryKey: persistentQuery([QUERY_KEY, params, clientParams]),
    queryFn: () => queryFn(params, clientParams),
    suspense,
    enabled,
    keepPreviousData,
    staleTime: STALE_TIME,
    refetchInterval,
  });
}
