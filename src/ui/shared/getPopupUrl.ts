import browser from 'webextension-polyfill';

export function getPopupUrl() {
  /**
   * Normally, we'd get the path to popup.html like this:
   * new URL(`../../ui/popup.html`, import.meta.url)
   * But parcel is being too smart, and because sometimes we're in
   * the service worker context, it bundles the entry for sw context as well,
   * which makes the popup UI crash.
   */
  const popupUrl = browser.runtime.getManifest().action?.default_popup;
  if (!popupUrl) {
    throw new Error('popupUrl not found');
  }
  return new URL(browser.runtime.getURL(popupUrl));
}
