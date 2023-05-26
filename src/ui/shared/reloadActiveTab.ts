import browser from 'webextension-polyfill';
import { getActiveTabOrigin } from './requests/getActiveTabOrigin';

export async function reloadActiveTab() {
  const tabData = await getActiveTabOrigin();
  const tabId = tabData?.tab.id;
  if (tabId) {
    browser.tabs.reload(tabId);
  }
}
