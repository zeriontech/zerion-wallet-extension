import browser from 'webextension-polyfill';

export async function getActiveTabUrl(): Promise<URL | null> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const url = tabs.find((tab) => tab.url)?.url;
  if (url) {
    return new URL(url);
  } else {
    return null;
  }
}
