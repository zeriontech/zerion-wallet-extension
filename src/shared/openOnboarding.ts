import browser from 'webextension-polyfill';
import { setAppMode, setWindowType } from 'src/ui/shared/WindowParam';
import { getPopupUrl } from 'src/ui/shared/getPopupUrl';

export function openOnboarding() {
  const popupUrl = getPopupUrl();
  setWindowType(popupUrl.searchParams, 'tab');
  setAppMode(popupUrl.searchParams, 'onboarding');
  browser.tabs.create({ url: popupUrl.toString() });
}
