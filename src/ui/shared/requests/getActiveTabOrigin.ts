import browser from 'webextension-polyfill';

export async function getActiveTabOrigin() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const url = tabs.find((tab) => tab.url)?.url;
  if (url) {
    return new URL(url).origin;
  } else {
    return null;
  }
}
