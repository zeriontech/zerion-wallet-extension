import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { createExtensionTest } from './test';

const extensionTest = createExtensionTest();
const test = extensionTest;

/**
 * Talks to the background wallet port directly so the test can seed the
 * device-wide preference without depending on a live asset page.
 */
async function walletRequest(page: Page, method: string, params: Record<string, unknown>) {
  return page.evaluate(
    async ({ method, params }) => {
      const port = chrome.runtime.connect({
        name: `${chrome.runtime.id}/wallet`,
      });
      const id = 1;
      return new Promise((resolve, reject) => {
        port.onMessage.addListener((message) => {
          if (message?.id !== id) return;
          if (message.error) {
            reject(new Error(JSON.stringify(message.error)));
          } else {
            resolve(message.result);
          }
        });
        port.postMessage({ jsonrpc: '2.0', id, method, params });
      });
    },
    { method, params },
  );
}

test('Hidden Assets persists, lists and unhides a token', async ({ extensionPopupUrl, page }) => {
  const settingsUrl = new URL('#/settings', extensionPopupUrl).toString();
  await page.goto(settingsUrl);

  const hiddenAssetsLink = page.getByRole('link', {
    name: /Hidden Assets/i,
  });
  await expect(hiddenAssetsLink).toBeVisible();
  await hiddenAssetsLink.click();
  await expect(page).toHaveURL(/\/settings\/hidden-assets/);
  await expect(page.getByText('No hidden tokens yet')).toBeVisible();

  await walletRequest(page, 'setGlobalPreferences', {
    preferences: { hiddenFungibleIds: ['eth'] },
  });

  await page.goto(settingsUrl);
  const hiddenAssetsWithCount = page.getByRole('link', {
    name: /Hidden Assets/i,
  });
  await expect(hiddenAssetsWithCount).toContainText('1');
  await hiddenAssetsWithCount.click();
  await page.getByRole('button', { name: /Unhide/i }).click();
  await expect(page.getByText('No hidden tokens yet')).toBeVisible();

  const preferences = (await walletRequest(page, 'getGlobalPreferences', {})) as {
    hiddenFungibleIds?: string[];
  };
  expect(preferences.hiddenFungibleIds).toEqual([]);
});
