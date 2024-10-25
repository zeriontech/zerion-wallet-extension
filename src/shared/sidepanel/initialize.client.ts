import browser from 'webextension-polyfill';
import { emitter } from 'src/ui/shared/events';
import { urlContext } from '../UrlContext';
import { initializeSidepanelMessaging } from './sidepanel-messaging.client';

async function handleActiveTabChange() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeWindowId: number | null = tabs[0]?.windowId || null;
  browser.tabs.onActivated.addListener((activeInfo) => {
    if (activeInfo.windowId === activeWindowId) {
      // If we setup sidepanel to only show for a specific tab,
      // We should check here somehow that this event is related to our tab
      emitter.emit('sidepanel/activeTabUpdated');
    }
  });
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.active && tab.windowId === activeWindowId && changeInfo.url) {
      const sidepanelStatus = await chrome.sidePanel.getOptions({ tabId });
      if (sidepanelStatus.enabled) {
        emitter.emit('sidepanel/activeTabUpdated');
      }
    }
  });
}

export function initializeSidepanelEvents() {
  if (urlContext.windowType === 'sidepanel') {
    initializeSidepanelMessaging();
    handleActiveTabChange();

    const params = new URL(window.location.href).searchParams;
    if (params.get('openPanelOnActionClick') === 'true') {
      // TODO: remove this param after we're done?
      chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true,
      });
    }
  }
}
