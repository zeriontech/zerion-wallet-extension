import browser, { Windows } from 'webextension-polyfill';
import { EventEmitter } from 'events';

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
    top: cTop,
    left: cLeft,
    width,
  } = await browser.windows.getCurrent({
    windowTypes: ['normal'],
  } as Windows.GetInfo);

  const top = (cTop || 0) + BROWSER_HEADER;
  const left = (cLeft || 0) + (width || 0) - WINDOW_SIZE.width;

  const currentWindow = await browser.windows.getCurrent();
  let win: BrowserWindow;
  if (currentWindow.state === 'fullscreen') {
    // browser.windows.create not pass state to chrome
    win = await chrome.windows.create({
      focused: true,
      url,
      type: 'popup',
      ...rest,
      width: undefined,
      height: undefined,
      left: undefined,
      top: undefined,
      state: 'fullscreen',
    });
  } else {
    win = await browser.windows.create({
      focused: true,
      url,
      type: 'popup',
      top,
      left,
      ...WINDOW_SIZE,
      ...rest,
    });
  }

  // shim firefox
  if (win.left !== left) {
    if (win.id) {
      await browser.windows.update(win.id, { left, top });
    }
  }

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

export default {
  openNotification,
  event,
  remove,
};
