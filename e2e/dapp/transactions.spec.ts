import { expect } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import { test } from './test';

test.describe.configure({ mode: 'parallel' });

const SEPOLIA_CHAIN_ID = '0xaa36a7';

/**
 * The approval's insufficient-balance warning is computed locally from the
 * wallet's positions. Mock a zero Sepolia balance so the test does not depend
 * on ZPI tracking the test address on the testnet.
 */
async function mockZeroSepoliaBalance(context: BrowserContext) {
  await context.route('**/wallet/get-simple-positions/v1*', async (route) => {
    const data = [
      {
        id: 'eth-ethereum-sepolia',
        amount: { currency: 'usd', quantity: '0', value: 0, usdValue: 0 },
        fungible: {
          id: 'eth',
          name: 'Ether',
          symbol: 'ETH',
          implementations: { 'ethereum-sepolia': { address: null, decimals: 18 } },
          iconUrl: null,
          verified: true,
          new: false,
          meta: { price: 2000, circulatingSupply: null, totalSupply: null, marketCap: null },
        },
        chain: { id: 'ethereum-sepolia', name: 'Ethereum Sepolia', iconUrl: '' },
      },
    ];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data, meta: null, errors: null }),
    });
  });
}

test.describe('Transactions', () => {
  test('eth_sendTransaction opens the approval and surfaces the missing testnet balance', async ({
    context,
    dapp,
    onboardingWallet,
  }) => {
    await mockZeroSepoliaBalance(context);
    await dapp.approveConnection(onboardingWallet.address);
    await dapp.selectNetwork(SEPOLIA_CHAIN_ID);

    const approvalPromise = dapp.waitForApprovalWindow();
    await dapp.clickSendEth();
    const approval = await approvalPromise;
    await approval.expectSendTransaction();
    await expect(approval.dialog).toContainText('Insufficient balance', {
      timeout: 30_000,
    });
    await approval.cancelTransaction();
    await expect.poll(() => approval.page.isClosed()).toBe(true);
  });

  test('rejecting eth_sendTransaction returns error code 4001 to the dapp', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);
    await dapp.selectNetwork(SEPOLIA_CHAIN_ID);

    const approvalPromise = dapp.waitForApprovalWindow();
    const responsePromise = dapp.request('eth_sendTransaction', [
      {
        from: onboardingWallet.address,
        to: '0x0000000000000000000000000000000000000001',
        value: '0x0',
      },
    ]);
    const approval = await approvalPromise;
    await approval.expectSendTransaction();
    await approval.cancelTransaction();

    const response = await responsePromise;
    expect(response.ok).toBe(false);
    if (response.ok) {
      return;
    }
    expect(response.error.code).toBe(4001);
  });
});
