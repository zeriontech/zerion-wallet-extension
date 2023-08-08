import EventEmitter from 'events';
import { nanoid } from 'nanoid';
import { createNanoEvents } from 'nanoevents';
import type { ErrorResponse } from '@json-rpc-tools/utils';
import type { Windows } from 'webextension-polyfill';
import browser from 'webextension-polyfill';
import type { RpcError, RpcResult } from 'src/shared/custom-rpc';
import { UserRejected } from 'src/shared/errors/errors';

const emitter = createNanoEvents<{
  windowRemoved: (windowId: number) => void;
}>();

browser.windows.onRemoved.addListener((windowId) => {
  emitter.emit('windowRemoved', windowId);
});

const IS_WINDOWS = /windows/i.test(navigator.userAgent);
const BROWSER_HEADER = 80;
const DEFAULT_WINDOW_SIZE = {
  width: 400 + (IS_WINDOWS ? 14 : 0), // windows cuts the width
  height: 700,
};

function getPopupRoute(route: string) {
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
  url.hash = route;
  return url.toString();
}

class NotificationWindow extends EventEmitter {
  windowId: number | null | undefined = null;
  id: string;
  idsMap: Map<string, number>;

  constructor() {
    super();
    this.id = nanoid();
    this.idsMap = new Map();
  }

  private getWindowId(id: string) {
    return this.idsMap.get(id);
  }

  private getNewId() {
    return nanoid();
  }

  async open<T>({
    route: initialRoute,
    search,
    onDismiss,
    onResolve,
    width = DEFAULT_WINDOW_SIZE.width,
    height = DEFAULT_WINDOW_SIZE.height,
    left,
    top,
  }: {
    route: string;
    search?: string;
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    onDismiss: (error?: ErrorResponse) => void;
    onResolve: (data: T) => void;
  }) {
    if (this.windowId != null) {
      browser.windows.remove(this.windowId);
    }

    const disposables: Array<() => void> = [];

    const onDone = () => {
      disposables.forEach((dispose) => dispose());
    };

    const id = this.getNewId();
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

    const { id: windowId } = await browser.windows.create({
      focused: true,
      url: getPopupRoute(`${initialRoute}?${params.toString()}`),
      type: 'popup',
      width,
      height,
      ...position,
    });

    if (windowId) {
      this.idsMap.set(id, windowId);
      disposables.push(() => this.idsMap.delete(id));
    }
    this.windowId = windowId;
    disposables.push(() => {
      if (this.windowId != null) {
        browser.windows.remove(this.windowId);
        this.windowId = null;
      }
    });
    const handleDismiss = (windowId: number, error?: ErrorResponse) => {
      if (windowId === this.windowId) {
        onDismiss(error);
        onDone();
      }
    };
    const handleWindowRemoved = (windowId: number) => {
      handleDismiss(windowId, new UserRejected('Window Closed'));
    };
    const unlisten = emitter.on('windowRemoved', handleWindowRemoved);
    disposables.push(unlisten);

    const handleResolve = ({ id, result }: RpcResult<T>) => {
      if (this.getWindowId(id) === windowId) {
        onResolve(result);
        onDone();
      }
    };
    const handleReject = (payload: RpcError) => {
      const windowId = this.getWindowId(payload.id);
      if (windowId != null) {
        handleDismiss(windowId, payload.error);
      }
    };
    this.on('resolve', handleResolve);
    this.on('reject', handleReject);
    disposables.push(() => {
      this.off('resolve', handleResolve);
      this.off('reject', handleReject);
    });
  }

  closeCurrentWindow() {
    if (this.windowId != null) {
      browser.windows.remove(this.windowId);
    }
  }
}

// Make it a singleton so that windows do not conflict
export const notificationWindow = new NotificationWindow();
