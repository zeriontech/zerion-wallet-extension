import browser from 'webextension-polyfill';
import { useCallback } from 'react';
import { useQuery } from 'react-query';
import { getActiveTabOrigin } from './requests/getActiveTabOrigin';

export function useReloadActiveTab() {
  const { data: tabData } = useQuery('activeTab/origin', getActiveTabOrigin);
  const tabId = tabData?.tab.id;
  return {
    reloadActiveTab: useCallback(() => {
      if (tabId) {
        browser.tabs.reload(tabId);
      }
    }, [tabId]),
  };
}
