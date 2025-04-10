import type { Page } from '@playwright/test';
import type { ExtensionPopupUrl } from 'e2e/tests/test';
import { setUrlContext } from 'src/shared/setUrlContext';
import type { UrlContext } from 'src/shared/types/UrlContext';

interface Params {
  extensionPopupUrl: ExtensionPopupUrl;
  path: string;
  urlContext?: Partial<UrlContext>;
}

export abstract class ExtensionPage {
  page: Page;
  url: URL;

  constructor(page: Page, { extensionPopupUrl, path, urlContext }: Params) {
    const url = new URL(`#${path}`, extensionPopupUrl);
    if (urlContext) {
      setUrlContext(url.searchParams, urlContext);
    }
    this.page = page;
    this.url = url;
  }

  async navigateTo() {
    await this.page.goto(this.url.toString());
  }
}
