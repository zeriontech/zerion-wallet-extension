import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.client';
import { useHiddenFungibleIds } from 'src/ui/features/hidden-assets/useHiddenFungibles';
import { type Params } from '../requests/wallet-get-chart';

export function useWalletChart(params: Params, { enabled = true } = {}) {
  const { hiddenFungibleIds, isReady } = useHiddenFungibleIds();
  const filteredParams = useMemo(
    () => ({ ...params, hiddenFungibleIds }),
    [params, hiddenFungibleIds],
  );
  return useQuery({
    queryKey: ['walletGetChart', filteredParams],
    queryFn: () => ZerionAPI.walletGetChart(filteredParams),
    suspense: false,
    keepPreviousData: true,
    staleTime: 1000 * 20,
    enabled: enabled && isReady,
  });
}
