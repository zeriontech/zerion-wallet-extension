import browser from 'webextension-polyfill';
import { getPopupUrl } from 'src/ui/shared/getPopupUrl';
import { setUrlContext } from 'src/ui/shared/setUrlContext';

export function openOnboarding() {
  const popupUrl = getPopupUrl();
  setUrlContext(popupUrl.searchParams, {
    appMode: 'onboarding',
    windowType: 'tab',
  });
  browser.tabs.create({ url: popupUrl.toString() });
}
