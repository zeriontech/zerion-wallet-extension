import browser from 'webextension-polyfill';

export function openOnboarding(popupUrl: URL) {
  popupUrl.searchParams.append('windowContext', 'tab');
  popupUrl.searchParams.append('context', 'onboarding');
  browser.tabs.create({
    url: popupUrl.toString(),
  });
}
