import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import {
  isHardwareContainer,
  isMnemonicContainer,
  isSignerContainer,
} from 'src/shared/types/validators';
import { walletPort } from 'src/ui/shared/channels';

export function useAllExistingMnemonicAddresses() {
  const { data: walletGroups } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    staleTime: 30000,
  });
  return useMemo(
    () =>
      walletGroups
        ?.filter((group) => isMnemonicContainer(group.walletContainer))
        ?.flatMap((group) => group.walletContainer.wallets)
        .map(({ address }) => normalizeAddress(address)),
    [walletGroups]
  );
}

export function useAllSignerOrHwAddresses() {
  const { data: walletGroups } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    staleTime: 30000,
  });
  return useMemo(
    () =>
      walletGroups
        ?.filter(
          (group) =>
            isSignerContainer(group.walletContainer) ||
            isHardwareContainer(group.walletContainer)
        )
        ?.flatMap((group) => group.walletContainer.wallets)
        .map(({ address }) => normalizeAddress(address)),
    [walletGroups]
  );
}
