import { LoginPage } from 'e2e/fixtures/pages/login';
import { createExtensionTest } from './test';

interface LoginFixtures {
  loginPage: LoginPage;
}

const extensionTest = createExtensionTest();
const test = extensionTest.extend<LoginFixtures>({
  loginPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new LoginPage(page, { extensionPopupUrl, path: '/login' }));
  },
});

const { describe, beforeEach } = test;

describe.configure({ mode: 'parallel' });
describe('Login', () => {
  beforeEach(async ({ loginPage }) => {
    await loginPage.navigateTo();
  });

  test('Matches snapshot', async ({ loginPage }) => {
    await loginPage.matchesSnapshot();
  });
});
