export type WalletListGroup = {
  id: string;
  title: string;
  walletIds: string[];
};

export const DEFAULT_WALLET_LIST_GROUP_ID = 'default';
export const WATCHLIST_WALLET_LIST_GROUP_ID = 'watchlist';

export const DEFAULT_WALLET_LIST_GROUPS: WalletListGroup[] = [
  {
    id: DEFAULT_WALLET_LIST_GROUP_ID,
    title: 'My Wallets',
    walletIds: [],
  },
  {
    id: WATCHLIST_WALLET_LIST_GROUP_ID,
    title: 'Watchlist',
    walletIds: [],
  },
];

export function getWalletId({
  address,
  groupId,
}: {
  address: string;
  groupId: string;
}): string {
  return `${groupId}--${address}`;
}

export function parseWalletId(walletId: string): {
  address: string;
  groupId: string;
} {
  const [groupId, ...addressParts] = walletId.split('--');
  return {
    groupId,
    address: addressParts.join('--'),
  };
}
