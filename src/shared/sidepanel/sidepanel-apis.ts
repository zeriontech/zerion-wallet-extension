import browser from 'webextension-polyfill';
import { getSidepanelUrl } from '../getPopupUrl';
import { invariant } from '../invariant';

export async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs.length ? tabs[0] : null;
}

async function resolveOpenOptions(
  openOptions?: chrome.sidePanel.OpenOptions
): Promise<chrome.sidePanel.OpenOptions> {
  if (openOptions) {
    return openOptions;
  } else {
    const currentWindow = await browser.windows.getCurrent();
    invariant(currentWindow.id, 'Current windowId not found');
    return { windowId: currentWindow.id };
  }
}

export async function openSidePanel({
  pathname,
  searchParams,
  openOptions,
}: {
  pathname: string;
  searchParams: URLSearchParams | null;
  openOptions?: chrome.sidePanel.OpenOptions;
}) {
  const url = getSidepanelUrl();
  // We use HashRouter currently
  if (searchParams) {
    url.hash = `${pathname}?${searchParams.toString()}`;
  } else {
    url.hash = pathname;
  }

  const effectiveOpenOptions = await resolveOpenOptions(openOptions);

  await chrome.sidePanel.open(effectiveOpenOptions);
  await chrome.sidePanel.setOptions({
    path: url.toString(),
    enabled: true,
  });
}
