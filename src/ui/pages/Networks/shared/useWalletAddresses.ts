import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { walletPort } from 'src/ui/shared/channels';

export function useWalletAddresses() {
  const { data: walletGroups, ...query } = useSuspenseQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
  });

  const addresses = useMemo(() => {
    if (!walletGroups) {
      return null;
    }
    const result: string[] = [];
    for (const group of walletGroups) {
      for (const wallet of group.walletContainer.wallets) {
        result.push(wallet.address);
      }
    }
    return result;
  }, [walletGroups]);

  return { data: addresses, ...query };
}
