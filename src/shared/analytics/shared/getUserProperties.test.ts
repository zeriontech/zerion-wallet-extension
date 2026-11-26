import { describe, expect, test, vi } from 'vite-plus/test';
import type { Account } from 'src/background/account/Account';
import { getUserProperties } from './getUserProperties';

vi.mock('src/background/constants', () => import('src/background/constants.mock'));

const OWNED_EVM = '0xAbC0000000000000000000000000000000000001';
const OWNED_SOLANA = '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs';
const WATCHED_EVM = '0xdEf0000000000000000000000000000000000002';

const account = {
  getCurrentWallet: () => ({
    uiGetWalletGroups: async () => [
      {
        id: 'owned',
        walletContainer: {
          wallets: [{ address: OWNED_EVM }, { address: OWNED_SOLANA }],
        },
      },
      {
        id: 'watchlist',
        walletContainer: { provider: null, wallets: [{ address: WATCHED_EVM }] },
      },
    ],
  }),
} as unknown as Account;

describe('getUserProperties', () => {
  test('reports local wallet counts without inventing balances or membership', async () => {
    const properties = await getUserProperties(account);

    expect(properties).toMatchObject({
      num_wallets: 3,
      num_my_wallets: 2,
      num_wallet_groups: 2,
      num_solana_wallets: 1,
      num_evm_wallets: 1,
      num_watchlist_evm_wallets: 1,
    });
    expect(properties).not.toHaveProperty('total_balance');
    expect(properties).not.toHaveProperty('zerion_premium_holder');
    expect(properties).not.toHaveProperty('num_zerion_wallets_eligible_for_xp_drop');
    expect(Object.keys(properties).filter((key) => key.includes('funded'))).toEqual([]);
  });
});
