import browser from 'webextension-polyfill';

export function openNewTabOverride(tabId: number, url: URL) {
  url.searchParams.append('windowContext', 'tab');
  url.searchParams.append('context', 'newtab');
  url.searchParams.append('layout', 'page');
  browser.tabs.update(tabId, {
    url: url.toString(),
  });
}
