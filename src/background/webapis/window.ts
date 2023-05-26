import { EventEmitter } from 'events';
import type { Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';

const IS_WINDOWS = /windows/i.test(navigator.userAgent);

const event = new EventEmitter();

browser.windows.onFocusChanged.addListener((winId) => {
  event.emit('windowFocusChange', winId);
});

browser.windows.onRemoved.addListener((winId) => {
  event.emit('windowRemoved', winId);
});

const BROWSER_HEADER = 80;
const WINDOW_SIZE = {
  width: 400 + (IS_WINDOWS ? 14 : 0), // windows cuts the width
  height: 640,
};

type BrowserWindow = browser.Windows.Window | chrome.windows.Window;
const create = async ({
  url,
  height = WINDOW_SIZE.height,
  ...rest
}: {
  url: string;
  height?: number;
}): Promise<BrowserWindow['id']> => {
  const {
    top: currentWindowTop,
    left: currentWindowLeft,
    width: currentWindowWidth,
  } = await browser.windows.getCurrent({
    windowTypes: ['normal'],
  } as Windows.GetInfo);

  const top = (currentWindowTop || 0) + BROWSER_HEADER;
  const left =
    (currentWindowLeft || 0) + (currentWindowWidth || 0) - WINDOW_SIZE.width;

  // const currentWindow = await browser.windows.getCurrent();
  const win = await browser.windows.create({
    focused: true,
    url,
    type: 'popup',
    top,
    left,
    // state: currentWindow.state === 'fullscreen' ? 'fullscreen' : undefined,
    ...WINDOW_SIZE,
    ...rest,
  });

  // shim firefox
  // if (win.left !== left) {
  //   if (win.id) {
  //     await browser.windows.update(win.id, { left, top });
  //   }
  // }

  return win.id;
};

const remove = async (winId: number) => {
  return browser.windows.remove(winId);
};

const openNotification = ({
  route,
  ...rest
}: {
  route: string;
  height?: number;
}): Promise<number | undefined> => {
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
  url.searchParams.append('templateType', 'dialog');
  if (route) {
    url.hash = route;
  }
  return create({ url: url.toString(), ...rest });
};

export const windowManager = {
  openNotification,
  event,
  remove,
};
