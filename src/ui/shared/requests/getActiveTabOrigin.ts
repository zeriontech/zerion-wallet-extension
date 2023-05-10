import browser from 'webextension-polyfill';

export async function getActiveTabOrigin() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs.find((tab) => tab.url);
  if (tab && tab.url) {
    const url = new URL(tab.url);
    return { url, tabOrigin: url.origin, tab };
  } else {
    return null;
  }
}
