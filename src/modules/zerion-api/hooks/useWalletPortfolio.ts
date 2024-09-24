import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { ZerionAPI } from '../zerion-api';
import type { Params } from '../requests/wallet-get-portfolio';
import type { BackendSourceParams } from '../shared';

export function useWalletPortfolio(
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
    refetchInterval?: number;
  } = {}
) {
  return useQuery({
    queryKey: persistentQuery(['walletGetPortfolio', params, source]),
    queryFn: () => ZerionAPI.walletGetPortfolio(params, { source }),
    suspense,
    enabled,
    keepPreviousData,
    staleTime: 20000,
    refetchInterval,
  });
}
