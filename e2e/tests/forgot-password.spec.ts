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
      })
    );
  },
});

const { describe, beforeEach } = test;

describe.configure({ mode: 'parallel' });
describe('Forgot Password', () => {
  beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.navigateTo();
  });

  test('Matches snapshot', async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.matchesSnapshot();
  });
});
