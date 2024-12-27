import path from 'path';
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { findFile } from './shared/findFile';

const pathToDist = path.join(__dirname, '../dist');

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  popupUrl: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToDist}`,
        `--load-extension=${pathToDist}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
  popupUrl: async ({ extensionId }, use) => {
    const popupFileName = findFile({
      dir: pathToDist,
      prefix: 'popup',
      ext: '.html',
    });
    if (!popupFileName) {
      throw Error('popup file not found');
    }
    await use(`chrome-extension://${extensionId}/${popupFileName}`);
  },
});
export const expect = test.expect;
