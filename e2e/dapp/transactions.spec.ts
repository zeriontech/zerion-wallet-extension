import { expect } from '@playwright/test';
import { test } from './test';

test.describe.configure({ mode: 'parallel' });

const SEPOLIA_CHAIN_ID = '0xaa36a7';

test.describe('Transactions', () => {
  test('eth_sendTransaction opens the approval and surfaces the missing testnet balance', async ({
    dapp,
    onboardingWallet,
  }) => {
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
