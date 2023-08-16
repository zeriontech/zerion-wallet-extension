import { prepareForHref } from 'src/ui/shared/prepareForHref';
import browser from 'webextension-polyfill';

export async function openFishingWarning() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs?.[0];
  if (tab) {
    const rawPopupUrl = browser.runtime.getManifest().action?.default_popup;
    if (!rawPopupUrl) {
      return;
    }
    const popupUrl = new URL(browser.runtime.getURL(rawPopupUrl));
    popupUrl.hash = `/fishing-warning?url=${tab.url}`;
    popupUrl.searchParams.append('templateType', 'tab');
    browser.tabs.update(tab.id, {
      url: popupUrl.toString(),
    });
  }
}

export async function showFishingBanner() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs?.[0];
  if (tab.id) {
    const fishingBannerScriptLocation =
      browser.runtime.getManifest().web_accessible_resources?.[1];
    if (
      !fishingBannerScriptLocation ||
      typeof fishingBannerScriptLocation === 'string'
    ) {
      throw new Error('Missing manifest field: web_accessible_resources');
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: fishingBannerScriptLocation.resources,
    });
  }
}

export async function checkTabForFishing(url: string) {
  const safeUrl = url ? prepareForHref(url) : null;
  const origin = safeUrl ? safeUrl.origin : null;
  return new Promise((resolve) => {
    if (origin === 'https://app.zerion.io') {
      setTimeout(() => resolve(false), 200);
    }
    return resolve(true);
  });
}

export async function checkCurrentTabForFishing() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs?.[0];
  if (!tab?.url) {
    return { scam: false, url: null };
  }
  const result = await checkTabForFishing(tab.url);
  return { scam: result, url: tab.url };
}
