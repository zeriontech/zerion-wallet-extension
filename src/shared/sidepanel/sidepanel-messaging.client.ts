import browser from 'webextension-polyfill';
import { urlContext } from '../UrlContext';
import { isSidepanelMessageRequest } from './types';
import { browserState } from './BrowserState';

export function initializeSidepanelMessaging() {
  browser.runtime.onMessage.addListener(async (request) => {
    if (isSidepanelMessageRequest(request)) {
      if (request.payload.method === 'is-sidepanel-open') {
        const { initialWindowId } = browserState;
        const isSidepanel = urlContext.windowType === 'sidepanel';
        const { windowId } = request.payload.params;
        const isTargetWindow =
          windowId == null ? true : windowId === initialWindowId;
        if (isSidepanel && isTargetWindow) {
          return { sidepanelStatus: 'open' };
        } else {
          // Delay response so that if there IS an open sidepanel it will respond first
          await new Promise((r) => setTimeout(r, 16));
          return { sidepanelStatus: 'closed' };
        }
      } else if (request.payload.method === 'close-sidepanel') {
        const { windowId } = request.payload.params;
        if (windowId) {
          if (browserState.initialWindowId === windowId) {
            window.close();
          }
        } else {
          window.close();
        }
      }
    }
  });
}
