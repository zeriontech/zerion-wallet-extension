import browser from 'webextension-polyfill';
import { getActiveTabOrigin } from './requests/getActiveTabOrigin';

export async function reloadActiveTab() {
  const tabData = await getActiveTabOrigin();
  const tabId = tabData?.tab.id;
  if (tabId) {
    browser.tabs.reload(tabId);
  }
}

export async function reloadTabsByOrigin({ origin }: { origin: string }) {
  const urlPattern = new URL(origin);

  urlPattern.pathname = '/*';
  urlPattern.search = '';
  urlPattern.hash = '';

  const tabs = await browser.tabs.query({ url: urlPattern.href });
  for (const tab of tabs) {
    if (tab.id) {
      browser.tabs.reload(tab.id);
    }
  }
}
