import browser from 'webextension-polyfill';
import { urlContext } from '../UrlContext';

export function initializeSidepanelEvents() {
  browser.runtime.onMessage.addListener(async (request) => {
    if (request.payload === 'is-sidepanel-open') {
      const isSidepanel = urlContext.windowType === 'sidepanel';
      return { sidepanelStatus: isSidepanel ? 'open' : 'closed' };
    }
  });
}
