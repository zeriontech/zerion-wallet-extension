import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BlockchainType } from 'src/shared/wallet/classifiers';
import { isMatchForEcosystem } from 'src/shared/wallet/shared';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import { getWalletId } from 'src/shared/wallet/wallet-list';
import { walletPort } from 'src/ui/shared/channels';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { getFullWalletList } from 'src/ui/pages/WalletSelect/shared';

export type AddressItem = {
  name: string | null;
  groupId: string | null;
  address: string;
  groupType: 'saved' | 'recent';
};

export function useReceiverAddressItems({
  ecosystem,
}: {
  ecosystem: BlockchainType;
}) {
  const { data: walletGroups, isLoading } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    suspense: false,
  });
  const { preferences } = usePreferences();

  const { savedNamesMap, savedWallets } = useMemo(() => {
    const wallets: AddressItem[] = [];
    const walletsMap = new Map<string, AddressItem>();
    const namesMap: Record<string, string> = {};
    if (walletGroups) {
      for (const group of walletGroups) {
        for (const wallet of group.walletContainer.wallets) {
          const walletId = getWalletId({
            address: wallet.address,
            groupId: group.id,
          });
          const address = normalizeAddress(wallet.address);
          walletsMap.set(walletId, {
            address,
            groupId: group.id,
            name: wallet.name || null,
            groupType: 'saved',
          });
          if (wallet.name) {
            namesMap[address] = wallet.name;
          }
        }
      }
      const walletIdList = getFullWalletList({
        walletsOrder: preferences?.walletsOrder,
        walletGroups,
      }).flatMap((group) => group.walletIds);
      for (const walletId of walletIdList) {
        const wallet = walletsMap.get(walletId);
        if (wallet) {
          wallets.push(wallet);
        }
      }
    }
    return { savedWallets: [...wallets], savedNamesMap: namesMap };
  }, [walletGroups, preferences?.walletsOrder]);

  const recentWallets = useMemo<AddressItem[]>(() => {
    return (
      preferences?.recentAddresses.map((address) => ({
        address,
        groupId: null,
        name: savedNamesMap[address] || null,
        groupType: 'recent' as const,
      })) || []
    );
  }, [preferences?.recentAddresses, savedNamesMap]);

  const items = useMemo(() => {
    return [...recentWallets, ...savedWallets].filter((wallet) =>
      isMatchForEcosystem(wallet.address, ecosystem)
    );
  }, [savedWallets, recentWallets, ecosystem]);

  return { items, isLoading };
}
