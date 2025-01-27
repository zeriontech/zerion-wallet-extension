import { test, expect } from './test';

test('simplest', async ({ popupUrl, page }) => {
  await page.goto(popupUrl);
  await expect(page).toHaveTitle(/Zerion/);
});
