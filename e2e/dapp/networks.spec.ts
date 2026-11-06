import { expect } from '@playwright/test';
import { captureApprovalWindow } from 'e2e/fixtures/pages/dapp/approval-window';
import { RawRequestPage } from 'e2e/fixtures/pages/dapp/raw-request';
import { test } from './test';

test.describe.configure({ mode: 'parallel' });

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_DECIMAL_CHAIN_ID = '11155111';

test.describe('Networks', () => {
  test('wallet_switchEthereumChain switches the dapp and emits chainChanged', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);
    await expect(dapp.chainId).toHaveText('0x1');

    await dapp.selectNetwork(SEPOLIA_CHAIN_ID);

    await expect(dapp.chainId).toHaveText(SEPOLIA_CHAIN_ID);
    await expect(dapp.connectionDetails).toContainText(SEPOLIA_DECIMAL_CHAIN_ID);
    await expect(dapp.page.locator('#currentNetworkName')).toContainText('Sepolia');

    // Switching an already-connected origin is immediate in Zerion.
    await dapp.expectNoExtensionPages();
  });

  test('rejecting wallet_switchEthereumChain returns the rejection to the dapp', async ({
    context,
    page,
  }) => {
    const raw = new RawRequestPage(await context.newPage());
    const approval = await captureApprovalWindow(
      context,
      () => raw.open('wallet_switchEthereumChain', [{ chainId: SEPOLIA_CHAIN_ID }]),
      [page, raw.page],
    );
    await approval.expectSwitchChain('Ethereum Sepolia', SEPOLIA_CHAIN_ID);
    await approval.rejectSwitch();
    await raw.expectResult('User Rejected the Request');
  });

  test('wallet_addEthereumChain surfaces the chain update and then switches', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);

    const approval = await captureApprovalWindow(dapp.context, () => dapp.clickAddEthereumChain(), [
      dapp.page,
    ]);
    await approval.expectAddOrUpdateChain('Elysium Testnet');
    await approval.acceptAddOrUpdateChain();

    await expect(dapp.chainId).toHaveText('0x53a', { timeout: 30_000 });
    await dapp.expectNoExtensionPages();
  });
});
