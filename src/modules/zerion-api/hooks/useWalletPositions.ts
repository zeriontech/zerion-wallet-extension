import { useQuery } from '@tanstack/react-query';
import { persistentQuery } from 'src/ui/shared/requests/queryClientPersistence';
import { ZerionAPI } from '../zerion-api.client';
import {
  toAddressPositions,
  type Params as WalletGetPositionsParams,
} from '../requests/wallet-get-positions';
import type { BackendSourceParams } from '../shared';

/**
 * NOTE:
 * This helper is an adapter for code that relied on {useAddressPositions} from defi-sdk
 * TODO:
 * Write and use `useWalletPositions` everywhere instead and remove this helper
 */
export function useHttpAddressPositions(
  params: WalletGetPositionsParams,
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
    queryKey: persistentQuery(['walletGetPositions', params, source]),
    queryFn: async () => {
      const response = await ZerionAPI.walletGetPositions(params, {
        source,
      });
      return toAddressPositions(response);
    },
    suspense,
    enabled,
    keepPreviousData,
    staleTime: 20000,
    refetchInterval,
  });
}
