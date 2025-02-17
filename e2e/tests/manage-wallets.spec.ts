import { ManageWalletsPage } from 'e2e/fixtures/pages/manage-wallets/manage-wallets';
import { EraseDataConfirmationDialog } from 'e2e/fixtures/components/erase-data-confirmation-dialog';
import { waitForPage } from 'e2e/utils/wait';
import { createExtensionTest } from './test';

const extensionTest = createExtensionTest();
const test = extensionTest.extend<{ manageWalletsPage: ManageWalletsPage }>({
  manageWalletsPage: async ({ extensionPopupUrl, page }, use) => {
    await use(
      new ManageWalletsPage(page, { extensionPopupUrl, path: '/wallets' })
    );
  },
});

const { describe, beforeEach, expect } = test;

describe.configure({ mode: 'parallel' });
describe('Manage Wallets', () => {
  beforeEach(async ({ manageWalletsPage }) => {
    await manageWalletsPage.navigateTo();
  });

  test('Matches snapshot', async ({ manageWalletsPage }) => {
    await manageWalletsPage.matchesSnapshot();
  });

  test('Action links are working', async ({
    context,
    page,
    manageWalletsPage,
  }) => {
    await manageWalletsPage.createNewWalletLink.click();
    await expect(page).toHaveURL(/.*\/get-started/);
    await page.goBack();

    await manageWalletsPage.importWalletLink.click();
    await expect(page).toHaveURL(/.*\/get-started\/import/);
    await page.goBack();

    await manageWalletsPage.addWatchAddressLink.click();
    await expect(page).toHaveURL(/.*\/get-started\/readonly/);
    await page.goBack();

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      manageWalletsPage.connectLedgerLink.click(),
    ]);
    await expect(newPage).toHaveURL(/.*\/connect-hardware-wallet/);
  });

  test('User can erase all data', async ({
    context,
    page,
    manageWalletsPage,
  }) => {
    await manageWalletsPage.eraseAllDataButton.click();

    const eraseDataConfirmationDialog = new EraseDataConfirmationDialog(
      page.getByRole('dialog')
    );
    await eraseDataConfirmationDialog.matchesSnapshot();
    await eraseDataConfirmationDialog.confirm();

    await waitForPage(context, (page) => page.url().includes('onboarding'));
  });
});
