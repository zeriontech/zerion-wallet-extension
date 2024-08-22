import browser from 'webextension-polyfill';
import type { UrlContext } from 'src/shared/types/UrlContext';
import { setUrlContext } from 'src/shared/setUrlContext';

async function getNextToActiveTabIndex(): Promise<number | undefined> {
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return activeTab ? activeTab.index + 1 : undefined;
}

export async function openUrl(url: URL, params?: Partial<UrlContext>) {
  if (params) {
    setUrlContext(url.searchParams, params);
  }
  const index = await getNextToActiveTabIndex();
  browser.tabs.create({ url: url.toString(), index });
}

export function openHref(
  event: React.MouseEvent,
  params?: Partial<UrlContext>
) {
  event.preventDefault();
  const attr = event.currentTarget.getAttributeNode('href');
  if (attr) {
    const url = new URL(attr.value, attr.baseURI);
    openUrl(url, params);
  }
}

export function openHrefInTabView(event: React.MouseEvent) {
  openHref(event, { windowType: 'tab', windowLayout: 'page' });
}
