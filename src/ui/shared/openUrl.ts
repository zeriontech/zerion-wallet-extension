import browser from 'webextension-polyfill';
import type { WindowContextParams } from './WindowContext';
import { setWindowLayout, setWindowType } from './WindowParam';

async function getNextToActiveTabIndex() {
  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return activeTab?.index + 1;
}

export async function openUrl(url: URL, context?: WindowContextParams) {
  if (context?.windowType) {
    setWindowType(url.searchParams, context.windowType);
  }
  if (context?.windowLayout) {
    setWindowLayout(url.searchParams, context.windowLayout);
  }
  const index = await getNextToActiveTabIndex();
  browser.tabs.create({ url: url.toString(), index });
}

export function openHref(
  event: React.MouseEvent,
  context?: WindowContextParams
) {
  event.preventDefault();
  const attr = event.currentTarget.getAttributeNode('href');
  if (attr) {
    const url = new URL(attr.value, attr.baseURI);
    openUrl(url, context);
  }
}
