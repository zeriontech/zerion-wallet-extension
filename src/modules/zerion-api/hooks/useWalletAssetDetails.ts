import { useQuery } from '@tanstack/react-query';
import { useConfidentialPermits } from 'src/ui/features/confidential-balances/useConfidentialPermits';
import { withPermits } from 'src/ui/features/confidential-balances/withPermits';
import type { Params } from '../requests/wallet-get-asset-details';
import { ZerionAPI } from '../zerion-api.client';
import type { BackendSourceParams } from '../shared';

export function useWalletAssetDetails(
  params: Params,
  { source }: BackendSourceParams,
  {
    suspense = false,
    enabled = true,
  }: {
    suspense?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { permits, fingerprint, isReady } = useConfidentialPermits(
    params.addresses
  );
  return useQuery({
    // the permits fingerprint stands in for `permits` in the key: signatures themselves never go into a (persisted) query key
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['walletGetAssetDetails', params, source, fingerprint],
    queryFn: () =>
      withPermits(permits, (permits) =>
        ZerionAPI.walletGetAssetDetails({ ...params, permits }, { source })
      ),
    suspense,
    enabled: enabled && isReady,
    staleTime: 20000,
  });
}
