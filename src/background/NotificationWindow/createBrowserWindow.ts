import type { Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

type WindowType = 'tab' | 'dialog';

function getPopupRoute(route: string, type: WindowType) {
  /**
   * Normally, we'd get the path to popup.html like this:
   * new URL(`../../ui/popup.html`, import.meta.url)
   * But parcel is being too smart, and because we're in
   * the service worker context here, it bundles the entry for sw context as well,
   * which makes the popup UI crash
   */
  const popupUrl = browser.runtime.getManifest().action?.default_popup;
  if (!popupUrl) {
    throw new Error('popupUrl not found');
  }
  const url = new URL(browser.runtime.getURL(popupUrl));
  url.searchParams.append('templateType', type);
  url.hash = route;
  return url.toString();
}

const IS_WINDOWS = /windows/i.test(navigator.userAgent);
const BROWSER_HEADER = 80;
const DEFAULT_WINDOW_SIZE = {
  width: 400 + (IS_WINDOWS ? 14 : 0), // windows cuts the width
  height: 700,
};

export interface WindowProps {
  route: string;
  type: WindowType;
  search?: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number | 'max';
}

export async function createBrowserWindow({
  top,
  left,
  width = DEFAULT_WINDOW_SIZE.width,
  height = DEFAULT_WINDOW_SIZE.height,
  route: initialRoute,
  search,
  type,
}: WindowProps) {
  const id = nanoid();
  const params = new URLSearchParams(search);
  params.append('windowId', String(id));

  const {
    top: currentWindowTop = 0,
    left: currentWindowLeft = 0,
    width: currentWindowWidth = 0,
  } = await browser.windows.getCurrent({
    windowTypes: ['normal'],
  } as Windows.GetInfo);

  const position = {
    top: top ?? currentWindowTop + BROWSER_HEADER,
    left: left ?? currentWindowLeft + currentWindowWidth - width,
  };

  let heightValue = DEFAULT_WINDOW_SIZE.height;
  if (height === 'max') {
    const currentWindow = await browser.windows.getCurrent();
    heightValue = Math.max(
      DEFAULT_WINDOW_SIZE.height,
      currentWindow.height ?? 0
    );
  } else {
    heightValue = height;
  }

  const { id: windowId } = await browser.windows.create({
    focused: true,
    url: getPopupRoute(`${initialRoute}?${params.toString()}`, type),
    type: type === 'dialog' ? 'popup' : 'normal',
    width,
    height: heightValue,
    ...position,
  });

  if (!windowId) {
    throw new Error('Window ID not received from the window API.');
  }

  return { id, windowId };
}
