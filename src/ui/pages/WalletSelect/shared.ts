import { isTruthy } from 'is-truthy-ts';
import type { BareWallet } from 'src/shared/types/BareWallet';
import type { DeviceAccount } from 'src/shared/types/Device';
import type { ExternallyOwnedAccount } from 'src/shared/types/ExternallyOwnedAccount';
import { isReadonlyAccount } from 'src/shared/types/validators';
import {
  DEFAULT_WALLET_LIST_GROUP_ID,
  DEFAULT_WALLET_LIST_GROUPS,
  getWalletId,
  WATCHLIST_WALLET_LIST_GROUP_ID,
  type WalletListGroup,
} from 'src/shared/wallet/wallet-list';

export type AnyWallet = ExternallyOwnedAccount | BareWallet | DeviceAccount;

export interface WalletGroupInfo {
  id: string;
  walletContainer: {
    wallets: AnyWallet[];
  };
}

/**
 * @description
 * Populate saved walletsOrder with all existing wallets.
 * Connected wallets that are not in the saved order will be added to the default group.
 * Readonly wallets that are not in the saved order will be added to the watchlist group.
 * Also filter wallets by predicate if provided.
 */
export function getFullWalletList({
  walletsOrder = DEFAULT_WALLET_LIST_GROUPS,
  walletGroups,
  predicate,
  filterEmptyGroups = true,
}: {
  walletsOrder?: WalletListGroup[];
  walletGroups: WalletGroupInfo[];
  predicate?: (item: AnyWallet) => boolean;
  filterEmptyGroups?: boolean;
}): WalletListGroup[] {
  const filteredWalletIds = new Set<string>();
  for (const group of walletGroups) {
    for (const wallet of group.walletContainer.wallets) {
      if (predicate && !predicate(wallet)) {
        continue;
      }
      filteredWalletIds.add(
        getWalletId({
          address: wallet.address,
          groupId: group.id,
        })
      );
    }
  }
  const usedWalletIds = new Set<string>();
  const result: WalletListGroup[] = walletsOrder.map((group) => ({
    id: group.id,
    title: group.title,
    walletIds: group.walletIds
      .map((walletId) => {
        if (walletId && filteredWalletIds.has(walletId)) {
          usedWalletIds.add(walletId);
          return walletId;
        }
        return null;
      })
      .filter(isTruthy),
  }));

  for (const group of walletGroups) {
    for (const wallet of group.walletContainer.wallets) {
      if (predicate && !predicate(wallet)) {
        continue;
      }
      const walletId = getWalletId({
        address: wallet.address,
        groupId: group.id,
      });
      if (usedWalletIds.has(walletId)) {
        continue;
      }
      const isReadonly = isReadonlyAccount(wallet);
      const targetWalletGroup = isReadonly
        ? WATCHLIST_WALLET_LIST_GROUP_ID
        : DEFAULT_WALLET_LIST_GROUP_ID;
      result.find((g) => g.id === targetWalletGroup)?.walletIds.push(walletId);
    }
  }

  return filterEmptyGroups
    ? result.filter((group) => group.walletIds.length > 0)
    : result;
}
