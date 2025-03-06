import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { ZerionAPI } from '../zerion-api.client';
import type { Params } from '../requests/wallet-get-pnl';

// TODO: remove?
export function useWalletPnL(
  params: Params,
  {
    suspense = false,
    enabled = true,
    keepPreviousData = false,
    refetchInterval,
  }: {
    suspense?: boolean;
    enabled?: boolean;
    keepPreviousData?: boolean;
    refetchInterval?: number;
  } = {}
) {
  return useQuery({
    queryKey: persistentQuery(['walletGetPnL', params]),
    queryFn: () => ZerionAPI.walletGetPnL(params),
    suspense,
    enabled,
    keepPreviousData,
    staleTime: 20000,
    refetchInterval,
  });
}
