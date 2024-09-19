import browser from 'webextension-polyfill';
import { getPopupUrl } from './getPopupUrl';
import { setUrlContext } from './setUrlContext';

export function openNewTabOverride(tabId: number) {
  const popupUrl = getPopupUrl();
  setUrlContext(popupUrl.searchParams, {
    appMode: 'newTab',
    windowType: 'tab',
    windowLayout: 'page',
  });
  browser.tabs.update(tabId, {
    url: popupUrl.toString(),
  });
}
