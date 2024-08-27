import browser from 'webextension-polyfill';
import { getSidepanelUrl } from '../getPopupUrl';
import { closeSidepanel } from './sidepanel-messaging.background';
import { browserState } from './BrowserState';
import { isSidepanelSupported } from './sidepanel-support';

export function initializeSidepanelCommands() {
  if (!isSidepanelSupported()) {
    return;
  }
  browser.commands.onCommand.addListener(async (command) => {
    const { currentWindowId } = browserState;
    try {
      /**
       * What we try to do here is close sidepanel if it's open and open it if it's closed.
       * But because we are only allowed to open it synchronously, we cannot to an async call
       * to check if it is currently open or not.
       * So the trick is to always call "close" first: if sidepanel is closed, there's noone to receive
       * the request, so it's ok. But if it is open, it will receive the request asyncronously, and therefore
       * it will react to it AFTER we call the {sidePanel.open} method later, so the {open} method will
       * not work, and that's what we need.
       */
      closeSidepanel({ windowId: currentWindowId ?? null });
    } catch {
      // it's ok, it might've not been open at all
    }
    const url = getSidepanelUrl();
    if (!currentWindowId) {
      return;
    }
    /**
     * Because of a chrome bug, we MUST use the "callback API" here instead of the
     * "Promise API", otherwise chrome thinks we are not reacting to a user gesture
     * and doesn't allow opening sidepanel programmatically:
     * https://issues.chromium.org/issues/40929586#comment4
     */
    chrome.sidePanel.open({ windowId: currentWindowId }, () => {
      chrome.sidePanel.setOptions({
        path: url.toString(),
        enabled: true,
      });
    });
  });
}
