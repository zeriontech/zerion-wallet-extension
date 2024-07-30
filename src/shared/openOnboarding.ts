import browser from 'webextension-polyfill';
import { getPopupUrl } from 'src/shared/getPopupUrl';
import { setUrlContext } from './setUrlContext';

export function openOnboarding() {
  const popupUrl = getPopupUrl();
  popupUrl.hash = '/onboarding';
  setUrlContext(popupUrl.searchParams, {
    appMode: 'onboarding',
    windowType: 'tab',
  });
  browser.tabs.create({ url: popupUrl.toString() });
}
