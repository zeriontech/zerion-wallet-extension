import browser from 'webextension-polyfill';

// TODO: rename to getPopupPath
export function getPopupUrl() {
  /**
   * The manifest is the single source of truth for the built popup path: the
   * bundler may rename or relocate it, and this code also runs in the service
   * worker, where importing the popup entry would pull the UI into the worker
   * bundle.
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
