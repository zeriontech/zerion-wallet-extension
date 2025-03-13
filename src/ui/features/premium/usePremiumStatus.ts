import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isReadonlyContainer } from 'src/shared/types/validators';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { walletPort } from '../../shared/channels';
import { useWalletsMetaByChunks } from '../../shared/requests/useWalletsMetaByChunks';

export function usePremiumStatus() {
  const { data: walletGroups, isLoading: isLoadingWalletGroups } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
  });
  const ownedGroups = useMemo(
    () =>
      walletGroups?.filter(
        (group) => !isReadonlyContainer(group.walletContainer)
      ),
    [walletGroups]
  );
  const ownedAddresses = useMemo(
    () =>
      ownedGroups?.flatMap((group) =>
        group.walletContainer.wallets.map((wallet) => wallet.address)
      ) || [],
    [ownedGroups]
  );

  const { data: walletsMeta, isLoading: isLoadingWalletsMeta } =
    useWalletsMetaByChunks({
      addresses: ownedAddresses,
      useErrorBoundary: false,
      suspense: false,
      enabled: !isLoadingWalletGroups,
    });

  const globalPremium = useMemo(() => {
    if (!walletsMeta) {
      return false;
    }

    return walletsMeta.some(
      (walletMeta) =>
        walletMeta.membership.premium?.plan &&
        walletMeta.membership.premium.plan !== 'Restricted'
    );
  }, [walletsMeta]);

  const premiumAddressesSet = useMemo(() => {
    return new Set(
      walletsMeta
        ?.filter((walletMeta) => Boolean(walletMeta.membership.premium?.plan))
        .map((walletMeta) => normalizeAddress(walletMeta.address)) || []
    );
  }, [walletsMeta]);

  return {
    globalPremium,
    premiumAddressesSet,
    isLoading: isLoadingWalletGroups || isLoadingWalletsMeta,
  };
}
