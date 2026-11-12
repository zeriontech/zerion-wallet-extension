import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import type { Account } from 'src/background/account/Account';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import type { WalletMeta } from 'src/modules/zerion-api/requests/wallet-get-meta';
import type { WalletPortfolio } from 'src/modules/zerion-api/requests/wallet-get-portfolio';
import type { ResponseBody } from 'src/modules/zerion-api/requests/ResponseBody';
import { getUserProperties } from './getUserProperties';

const PORTFOLIO = {
  data: {
    totalValue: 1500,
    positionsChainsDistribution: { ethereum: 1000, solana: 500 },
  },
} as unknown as ResponseBody<WalletPortfolio>;

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

const portfolioSpy = vi.spyOn(ZerionAPI, 'walletGetPortfolio');
const activitySpy = vi.spyOn(ZerionAPI, 'walletCheckActivity');
const metaSpy = vi.spyOn(ZerionAPI, 'getWalletsMetaByChunks');

beforeEach(() => {
  portfolioSpy.mockReset().mockResolvedValue(PORTFOLIO);
  activitySpy.mockReset();
  metaSpy
    .mockReset()
    .mockImplementation(async (addresses: string[]) =>
      addresses.map((address) => ({ address, membership: {} }) as WalletMeta),
    );
});

describe('getUserProperties', () => {
  test('does not query wallet activity and sends no funded-wallet counts', async () => {
    const properties = await getUserProperties(account);

    expect(activitySpy).not.toHaveBeenCalled();
    expect(properties.total_balance).toBe(1500);
    expect(Object.keys(properties).filter((key) => key.includes('funded'))).toEqual([]);
  });
});
