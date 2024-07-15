import browser from 'webextension-polyfill';
import { urlContext, type UrlContextParams } from './UrlContext';

async function getNextToActiveTabIndex() {
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return activeTab?.index + 1;
}

export async function openUrl(url: URL, params?: UrlContextParams) {
  if (params) {
    urlContext.set(url.searchParams, params);
  }
  const index = await getNextToActiveTabIndex();
  browser.tabs.create({ url: url.toString(), index });
}

export function openHref(event: React.MouseEvent, params?: UrlContextParams) {
  event.preventDefault();
  const attr = event.currentTarget.getAttributeNode('href');
  if (attr) {
    const url = new URL(attr.value, attr.baseURI);
    openUrl(url, params);
  }
}
