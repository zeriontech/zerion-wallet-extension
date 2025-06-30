import { useQuery } from '@tanstack/react-query';
import { walletPort } from 'src/ui/shared/channels';
import type { WalletGroup } from 'src/shared/types/WalletGroup';
import { checkForTestAddress } from '../meta-app-state';
import { useEvent } from '../useEvent';

export function useWalletGroup({ groupId }: { groupId: string }) {
  return useQuery({
    queryKey: ['wallet/uiGetWalletGroup', groupId],
    queryFn: () => walletPort.request('uiGetWalletGroup', { groupId }),
    useErrorBoundary: true,
  });
}

export function useWalletGroups(options: { enabled?: boolean } = {}) {
  const onSuccess = useEvent((groups: WalletGroup[] | null) => {
    requestIdleCallback(() => {
      checkForTestAddress(groups);
    });
  });
  return useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: async () => {
      const result = await walletPort.request('uiGetWalletGroups');
      onSuccess(result);
      return result;
    },
    useErrorBoundary: true,
    enabled: options.enabled,
  });
}
