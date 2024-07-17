import browser from 'webextension-polyfill';
import { setUrlContext } from './setUrlContext';
import type { UrlContext } from './UrlContext';

async function getNextToActiveTabIndex() {
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return (activeTab?.index ?? -1) + 1;
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
