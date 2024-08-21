import browser from 'webextension-polyfill';
import { urlContext } from '../UrlContext';

/**
 * TODO:
 * Extract type for returned value to reuse
 * between ui and background scripts
 */
export function initializeSidepanelEvents() {
  browser.runtime.onMessage.addListener(async (request) => {
    if (request.payload === 'is-sidepanel-open') {
      const isSidepanel = urlContext.windowType === 'sidepanel';
      return { sidepanelStatus: isSidepanel ? 'open' : 'closed' };
    }
  });
}
