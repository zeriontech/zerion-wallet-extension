import { EraseDataConfirmationDialog } from 'e2e/fixtures/components/erase-data-confirmation-dialog';
import { ForgotPasswordPage } from 'e2e/fixtures/pages/forgot-password';
import { createExtensionTest } from './test';

interface ManageWalletsFixtures {
  forgotPasswordPage: ForgotPasswordPage;
}

const extensionTest = createExtensionTest();
const test = extensionTest.extend<ManageWalletsFixtures>({
  forgotPasswordPage: async ({ extensionPopupUrl, page }, use) => {
    await use(
      new ForgotPasswordPage(page, {
        extensionPopupUrl,
        path: '/forgot-password',
      }),
    );
  },
});

const { describe, beforeEach, expect } = test;

describe.configure({ mode: 'parallel' });
describe('Forgot Password', () => {
  beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.navigateTo();
  });

  test('Matches snapshot', async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.matchesSnapshot();
  });

  test('Erasing all data requires typing ERASE', async ({ forgotPasswordPage, page }) => {
    await forgotPasswordPage.clearAllDataButton.click();

    const dialog = new EraseDataConfirmationDialog(page.getByRole('dialog'));
    await dialog.matchesSnapshot();
    await expect(dialog.eraseButton).toBeDisabled();

    await dialog.confirmationInput.fill('ERAS');
    await expect(dialog.eraseButton).toBeDisabled();

    await dialog.confirmationInput.fill('ERASE');
    await expect(dialog.eraseButton).toBeEnabled();
  });

  test('Closing and reopening the dialog clears the confirmation', async ({
    forgotPasswordPage,
    page,
  }) => {
    await forgotPasswordPage.clearAllDataButton.click();

    const dialog = new EraseDataConfirmationDialog(page.getByRole('dialog'));
    await dialog.confirmationInput.fill('ERASE');
    await expect(dialog.eraseButton).toBeEnabled();

    await dialog.backButton.click();
    await forgotPasswordPage.clearAllDataButton.click();

    await expect(dialog.eraseButton).toBeDisabled();
    await expect(dialog.confirmationInput).toHaveValue('');
  });
});
