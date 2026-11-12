import { SettingsPage } from '../fixtures/pages/settings';
import { PerpsDepositPage, PerpsWithdrawPage } from '../fixtures/pages/perps';
import { PlaygroundPage } from '../fixtures/pages/playground';
import { createExtensionTest } from './test';

interface LazyRoutesFixtures {
  perpsDepositPage: PerpsDepositPage;
  perpsWithdrawPage: PerpsWithdrawPage;
  playgroundPage: PlaygroundPage;
  settingsPage: SettingsPage;
}

const extensionTest = createExtensionTest();
const test = extensionTest.extend<LazyRoutesFixtures>({
  perpsDepositPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new PerpsDepositPage(page, { extensionPopupUrl, path: '/perps/deposit' }));
  },
  perpsWithdrawPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new PerpsWithdrawPage(page, { extensionPopupUrl, path: '/perps/withdraw' }));
  },
  playgroundPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new PlaygroundPage(page, { extensionPopupUrl, path: '/playground' }));
  },
  settingsPage: async ({ extensionPopupUrl, page }, use) => {
    await use(new SettingsPage(page, { extensionPopupUrl, path: '/settings' }));
  },
});

const { describe, expect } = test;

// Chunks emitted by the `pages` build target for the routes that
// src/ui/App/App.tsx imports with React.lazy().
const CHUNK = {
  perps: /\/assets\/Perps-[^/]+\.js$/,
  playground: /\/assets\/Playground-[^/]+\.js$/,
  previewsPage: /\/assets\/PreviewsPage-[^/]+\.js$/,
};

describe('Lazy routes', () => {
  test('Perps deposit page loads on demand', async ({ context, perpsDepositPage }) => {
    // The deposit form renders only after wallet/get-simple-positions settles.
    // Answer it locally so the assertion never waits on live market data.
    await context.route('**/wallet/get-simple-positions/v1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: null, errors: null }),
      });
    });
    await perpsDepositPage.navigateTo();
    await perpsDepositPage.ready();
  });

  test('Perps withdraw page loads on demand', async ({ perpsWithdrawPage }) => {
    await perpsWithdrawPage.navigateTo();
    await perpsWithdrawPage.ready();
  });

  test('Playground loads on demand', async ({ playgroundPage }) => {
    await playgroundPage.navigateTo();
    await playgroundPage.ready();
  });

  test('Chunks are requested only by the routes that need them', async ({
    page,
    settingsPage,
    perpsWithdrawPage,
    playgroundPage,
  }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));

    // Settings is statically imported, so opening it must not fetch the
    // chunks of the routes that were made lazy.
    await settingsPage.navigateTo();
    await expect(settingsPage.securityLink).toBeVisible({ timeout: 30_000 });
    expect(requested.filter((url) => CHUNK.perps.test(url))).toEqual([]);
    expect(requested.filter((url) => CHUNK.playground.test(url))).toEqual([]);
    expect(requested.filter((url) => CHUNK.previewsPage.test(url))).toEqual([]);

    // ...while the lazily loaded routes fetch theirs.
    await perpsWithdrawPage.navigateTo();
    await perpsWithdrawPage.ready();
    expect(requested.filter((url) => CHUNK.perps.test(url)).length).toBeGreaterThan(0);

    await playgroundPage.navigateTo();
    await playgroundPage.ready();
    expect(requested.filter((url) => CHUNK.playground.test(url)).length).toBeGreaterThan(0);
    expect(requested.filter((url) => CHUNK.previewsPage.test(url)).length).toBeGreaterThan(0);
  });
});
