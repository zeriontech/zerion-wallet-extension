import browser from 'webextension-polyfill';

// TODO: rename to getPopupPath
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

// TODO: rename to getSidepanelPath
export function getSidepanelUrl() {
  // @ts-ignore extension manifest types
  const sidepanelUrl = browser.runtime.getManifest().side_panel?.default_path;
  if (!sidepanelUrl) {
    throw new Error('sidepanelUrl not found');
  }
  return new URL(browser.runtime.getURL(sidepanelUrl));
}
