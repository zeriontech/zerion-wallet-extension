import { EventEmitter } from 'events';
import browser, { Windows } from 'webextension-polyfill';

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
  height: 600,
};

type BrowserWindow = browser.Windows.Window | chrome.windows.Window;
const create = async ({
  url,
  ...rest
}: {
  url: string;
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

const openNotification = ({ route = '', ...rest } = {}): Promise<
  number | undefined
> => {
  const url = new URL(`../../ui/dialog.html`, import.meta.url);
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
