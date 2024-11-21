import { test, expect } from './test';

test('simplest', async ({ popupUrl, page }) => {
  await page.goto(popupUrl);
  await expect(page).toHaveTitle(/Zerion/);
  await page.waitForTimeout(60_000);
});
