import type { Locator } from '@playwright/test';

export async function selectItems({
  items,
  count,
  showMoreLocator,
  continueLocator,
}: {
  items: Locator;
  count: number;
  showMoreLocator: Locator;
  continueLocator?: Locator;
}) {
  while ((await items.count()) < count) {
    await showMoreLocator.click();
  }

  for (let i = 0; i < count; i++) {
    await items.nth(i).click();
  }

  if (continueLocator) {
    await continueLocator.click();
  }
}
