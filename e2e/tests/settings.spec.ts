import { SettingsPage } from 'e2e/fixtures/pages/settings';
import { LoginPage } from 'e2e/fixtures/pages/login';
import { createExtensionTest } from './test';

interface SettingsFixtures {
  settingsPage: SettingsPage;
  loginPage: LoginPage;
}

const extensionTest = createExtensionTest();
const test = extensionTest.extend<SettingsFixtures>({
  settingsPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new SettingsPage(page, { extensionPopupUrl, path: '/settings' }));
  },
  loginPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new LoginPage(page, { extensionPopupUrl, path: '/login' }));
  },
});

const { describe, beforeEach, expect } = test;

describe.configure({ mode: 'parallel' });
describe('Settings', () => {
  beforeEach(async ({ settingsPage }) => {
    await settingsPage.navigateTo();
  });

  test('Matches snapshot', async ({ settingsPage }) => {
    await settingsPage.matchesSnapshot();
  });

  test('User can lock and unlock wallet', async ({ page, settingsPage, loginPage, password }) => {
    await settingsPage.lockWallet();
    await expect(page).toHaveURL(/.*\/login/);
    await loginPage.unlock(password);
    await expect(page).toHaveURL(/.*\/overview/);
  });

  test('Extra Fee Protection is on by default and can be turned off', async ({ page }) => {
    // Keep the approvals list off the live Hyperliquid API.
    await page.route('https://api.hyperliquid.xyz/info', (route) => route.fulfill({ json: [] }));
    await page.getByRole('link', { name: /Hyperliquid/i }).click();
    await expect(page).toHaveURL(/.*\/settings\/hyperliquid/);
    const toggle = page.getByRole('checkbox').first();
    await expect(toggle).toBeChecked();
    await toggle.click({ force: true });
    await expect(toggle).not.toBeChecked();
    await page.reload();
    await expect(page.getByRole('checkbox').first()).not.toBeChecked();
  });
});
