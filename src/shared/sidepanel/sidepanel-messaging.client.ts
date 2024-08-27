import browser from 'webextension-polyfill';
import { urlContext } from '../UrlContext';
import { isSidepanelMessageRequest } from './types';
import { browserState } from './BrowserState';

export function initializeSidepanelMessaging() {
  browser.runtime.onMessage.addListener(async (request) => {
    if (isSidepanelMessageRequest(request)) {
      if (request.payload.method === 'is-sidepanel-open') {
        const isSidepanel = urlContext.windowType === 'sidepanel';
        return { sidepanelStatus: isSidepanel ? 'open' : 'closed' };
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
