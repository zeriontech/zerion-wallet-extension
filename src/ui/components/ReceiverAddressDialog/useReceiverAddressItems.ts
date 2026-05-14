import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeAddress } from 'src/shared/normalizeAddress';
import {
  getWalletId,
  WATCHLIST_WALLET_LIST_GROUP_ID,
} from 'src/shared/wallet/wallet-list';
import { walletPort } from 'src/ui/shared/channels';
import { usePreferences } from 'src/ui/features/preferences/usePreferences';
import { useAddressBook } from 'src/ui/features/address-book';
import { getFullWalletList } from 'src/ui/pages/WalletSelect/shared';

export type AddressItem = {
  name: string | null;
  groupId: string | null;
  address: string;
  groupType: 'recent' | 'wallet' | 'watchlist' | 'address-book';
};

export function useReceiverAddressItems() {
  const { data: walletGroups, isLoading } = useQuery({
    queryKey: ['wallet/uiGetWalletGroups'],
    queryFn: () => walletPort.request('uiGetWalletGroups'),
    useErrorBoundary: true,
    suspense: false,
  });
  const { preferences } = usePreferences();
  const { entries: addressBookEntries } = useAddressBook();

  const { savedNamesMap, walletItems, watchlistItems } = useMemo(() => {
    const walletList: AddressItem[] = [];
    const watchlist: AddressItem[] = [];
    const itemsMap = new Map<
      string,
      { address: string; name: string | null; groupId: string }
    >();
    const namesMap: Record<string, string> = {};
    if (walletGroups) {
      for (const group of walletGroups) {
        for (const wallet of group.walletContainer.wallets) {
          const walletId = getWalletId({
            address: wallet.address,
            groupId: group.id,
          });
          const address = normalizeAddress(wallet.address);
          itemsMap.set(walletId, {
            address,
            groupId: group.id,
            name: wallet.name || null,
          });
          if (wallet.name) {
            namesMap[address] = wallet.name;
          }
        }
      }
      const displayGroups = getFullWalletList({
        walletsOrder: preferences?.walletsOrder,
        walletGroups,
      });
      for (const displayGroup of displayGroups) {
        const isWatchlist = displayGroup.id === WATCHLIST_WALLET_LIST_GROUP_ID;
        for (const walletId of displayGroup.walletIds) {
          const entry = itemsMap.get(walletId);
          if (!entry) continue;
          const item: AddressItem = {
            address: entry.address,
            groupId: entry.groupId,
            name: entry.name,
            groupType: isWatchlist ? 'watchlist' : 'wallet',
          };
          if (isWatchlist) {
            watchlist.push(item);
          } else {
            walletList.push(item);
          }
        }
      }
    }
    for (const entry of addressBookEntries) {
      if (entry.name) {
        namesMap[normalizeAddress(entry.address)] = entry.name;
      }
    }

    return {
      savedNamesMap: namesMap,
      walletItems: walletList,
      watchlistItems: watchlist,
    };
  }, [walletGroups, preferences?.walletsOrder, addressBookEntries]);

  const recentItems = useMemo<AddressItem[]>(() => {
    return (
      preferences?.recentAddresses.map((address) => ({
        address,
        groupId: null,
        name: savedNamesMap[address] || null,
        groupType: 'recent' as const,
      })) || []
    );
  }, [preferences?.recentAddresses, savedNamesMap]);

  const addressBookItems = useMemo<AddressItem[]>(() => {
    return addressBookEntries.map((entry) => ({
      address: normalizeAddress(entry.address),
      groupId: null,
      name: entry.name || null,
      groupType: 'address-book' as const,
    }));
  }, [addressBookEntries]);

  return {
    recentItems,
    addressBookItems,
    walletItems,
    watchlistItems,
    isLoading,
  };
}
