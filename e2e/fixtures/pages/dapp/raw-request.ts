import { expect, type Page } from '@playwright/test';
import { dappUrl } from 'e2e/dapp/config';

/**
 * The test dapp's request.html page calls one raw provider method from a real
 * dapp origin. It is used for paths that the main page has no button for,
 * such as a chain switch before the origin is connected.
 */
export class RawRequestPage {
  constructor(readonly page: Page) {}

  async open(method: string, params?: unknown) {
    const url = new URL(dappUrl('request.html'));
    url.searchParams.set('method', method);
    if (params !== undefined) {
      url.searchParams.set('params', JSON.stringify(params));
    }
    await this.page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  }

  async expectResult(text: string | RegExp) {
    await expect(this.page.locator('.request-body')).toContainText(text);
  }
}
