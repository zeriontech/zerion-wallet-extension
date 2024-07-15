import browser from 'webextension-polyfill';
import { getPopupUrl } from 'src/ui/shared/getPopupUrl';
import { urlContext } from 'src/ui/shared/UrlContext';

export function openOnboarding() {
  const popupUrl = getPopupUrl();
  urlContext.set(popupUrl.searchParams, {
    appMode: 'onboarding',
    windowType: 'tab',
  });
  browser.tabs.create({ url: popupUrl.toString() });
}
