import { expect, test, vi } from 'vite-plus/test';
import { ZerionAPI } from 'src/modules/zerion-api/zerion-api.background';
import type { Wallet } from 'src/shared/types/Wallet';
import { referralProgramService } from './ReferralProgramService.background';
import { saveReferrerData } from './storage';

vi.mock('src/background/constants', () => import('src/background/constants.mock'));
vi.mock('src/modules/zerion-api/zerion-api.background', () => ({
  ZerionAPI: { checkReferral: vi.fn(), referWallet: vi.fn() },
}));
vi.mock('./storage', () => ({ saveReferrerData: vi.fn() }));

test('only refers eligible software wallets still owned at signing time', async () => {
  const owned = '0xabcdef0000000000000000000000000000000001';
  const ineligible = '0xabcdef0000000000000000000000000000000002';
  const watchOnly = '0xabcdef0000000000000000000000000000000003';
  const noLongerOwned = '0xabcdef0000000000000000000000000000000004';
  const referrer = { referralCode: 'example', address: null, handle: null };
  vi.mocked(ZerionAPI.checkReferral).mockResolvedValue({ data: referrer });
  const signMessage = vi.fn().mockResolvedValue('signature');
  const wallet = {
    signMessage,
    uiGetWalletGroups: async () => [
      {
        walletContainer: {
          seedType: 'privateKey',
          wallets: [
            { address: owned, privateKey: '<masked>' },
            { address: ineligible, privateKey: '<masked>' },
          ],
        },
      },
      { walletContainer: { provider: null, wallets: [{ address: watchOnly }] } },
    ],
  } as unknown as Wallet;
  referralProgramService.initialize({ getWallet: () => wallet });

  await expect(
    referralProgramService.applyReferralCodeToAllWallets({
      referralCode: referrer.referralCode,
      eligibleAddresses: [`0x${owned.slice(2).toUpperCase()}`, watchOnly, noLongerOwned],
    }),
  ).resolves.toEqual(referrer);
  expect(signMessage).toHaveBeenCalledTimes(1);
  expect(ZerionAPI.referWallet).toHaveBeenCalledExactlyOnceWith({
    address: owned,
    referralCode: referrer.referralCode,
    signature: 'signature',
  });
  expect(saveReferrerData).toHaveBeenCalledWith(referrer);
});
