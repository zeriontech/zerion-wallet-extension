import type { BrowserContext, Page } from '@playwright/test';
import { rejectAfterDelay } from 'src/shared/rejectAfterDelay';

const DEFAULT_PAGE_WAIT_TIMEOUT = 30_000;

export async function waitForPage(
  context: BrowserContext,
  predicate: (page: Page) => boolean | Promise<boolean>,
  timeout = DEFAULT_PAGE_WAIT_TIMEOUT
): Promise<Page> {
  return Promise.race([
    new Promise<Page>((resolve) => {
      context.on('page', async (page) => {
        if (await predicate(page)) {
          resolve(page);
        }
      });
    }),
    rejectAfterDelay(timeout, 'waitForPage'),
  ]);
}
