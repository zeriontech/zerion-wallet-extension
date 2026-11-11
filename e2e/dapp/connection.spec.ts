import { expect } from '@playwright/test';
import { test } from './test';

test.describe.configure({ mode: 'parallel' });

test.describe('Connection', () => {
  test('EIP-6963 discovery exposes Zerion and connection returns the account', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.expectDiscovered();
    await dapp.approveConnection(onboardingWallet.address);

    await expect(dapp.chainId).toHaveText('0x1');
    await expect(dapp.connectionDetails).toContainText('Zerion');
    const shortened = `${onboardingWallet.address
      .toLowerCase()
      .slice(0, 6)}…${onboardingWallet.address.toLowerCase().slice(-4)}`;
    await expect(dapp.connectionDetails).toContainText(shortened);

    await dapp.getAccounts();
    await dapp.expectAccountsResult(onboardingWallet.address);

    await dapp.getPermissions();
    await dapp.expectPermissions('eth_accounts');

    await dapp.expectNoExtensionPages();
  });

  test('rejecting the connection leaves the dapp disconnected and allows a retry', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.expectDiscovered();
    await dapp.rejectConnection();
    await dapp.expectDisconnected();

    await dapp.approveConnection(onboardingWallet.address);
    await expect(dapp.accounts).toContainText(/0x/i);
  });

  test('clearing the active provider and selecting Zerion again reconnects without an approval window', async ({
    dapp,
    onboardingWallet,
  }) => {
    await dapp.approveConnection(onboardingWallet.address);
    await dapp.clearProvider();
    await dapp.expectDisconnected();

    await dapp.reconnect();
    await dapp.expectConnected(onboardingWallet.address);
    await dapp.expectNoExtensionPages();
  });
});
