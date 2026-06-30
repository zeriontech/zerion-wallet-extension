import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { type Params } from '../requests/wallet-get-chart';

export function useWalletChart(params: Params, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['walletGetChart', params],
    queryFn: () => ZerionAPI.walletGetChart(params),
    suspense: false,
    keepPreviousData: true,
    staleTime: 1000 * 20,
    enabled,
  });
}
