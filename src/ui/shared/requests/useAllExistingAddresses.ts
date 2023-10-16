import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { walletPort } from 'src/ui/shared/channels';

export function useAllExistingAddresses() {
  const { data: walletGroups } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    staleTime: 30000,
  });
  return useMemo(
    () =>
      walletGroups
        ?.flatMap((group) => group.walletContainer.wallets)
        .map(({ address }) => normalizeAddress(address)),
    [walletGroups]
  );
}
