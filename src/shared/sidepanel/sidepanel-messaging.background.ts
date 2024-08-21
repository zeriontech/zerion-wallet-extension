import browser from 'webextension-polyfill';

/**
 * Sidepanel can be opened in one browser window and not in the other
 * TODO: create helper to check if sidepanel is opened for the window that has active tab
 */
export async function isSidepanelOpen() {
  try {
    const response = await browser.runtime.sendMessage({
      payload: 'is-sidepanel-open',
    });
    return response.sidepanelStatus === 'open';
  } catch {
    return false;
  }
}
