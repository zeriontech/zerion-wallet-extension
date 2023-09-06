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

interface WindowProps {
  route: string;
  search?: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

interface Events {
  resolve: (value: RpcResult) => void;
  reject: (value: RpcError) => void;
  open: (value: { requestId: string; windowId: number; id: string }) => void;
  settle: (value: {
    status: 'fulfilled' | 'rejected';
    result?: unknown;
    error?: ErrorResponse;
    id?: string;
    windowId?: number;
  }) => void;
}

class NotificationWindow {
  windowId: number | null | undefined = null;
  private emitter = createNanoEvents<Events>();
  private idsMap: Map<string, number>;
  private requestIds: Map<string, string> = new Map();
  private pendingWindows: Map<string, { windowId: number; id: string }> =
    new Map();

  constructor() {
    this.idsMap = new Map();
    this.trackOpenedWindows();
    this.trackWindowEvents();
  }

  private closeWindowById(id: string) {
    const windowId = this.idsMap.get(id);
    if (windowId) {
      browser.windows.remove(windowId);
      this.idsMap.delete(id);
      this.requestIds.delete(id);
    }
  }

  private closeWindow(windowId: number) {
    browser.windows.remove(windowId);
    // clean up idsMap:
    const id = Array.from(this.idsMap.keys()).find(
      (id) => this.idsMap.get(id) === windowId
    );
    if (id) {
      this.idsMap.delete(id);
      this.requestIds.delete(id);
    }
  }

  private trackWindowEvents() {
    this.emitter.on('resolve', ({ id, result }) => {
      this.emitter.emit('settle', { status: 'fulfilled', id, result });
      this.closeWindowById(id);
    });
    this.emitter.on('reject', ({ id, error }) => {
      this.emitter.emit('settle', { status: 'rejected', id, error });
      this.closeWindowById(id);
    });
    emitter.on('windowRemoved', (windowId) => {
      // This event can be triggered as a consequence of our own closeWindowById
      // method. We should check that this `windowId` hasn't been removed
      if (
        Array.from(this.idsMap.values()).some((value) => value === windowId)
      ) {
        this.emitter.emit('settle', {
          status: 'rejected',
          windowId,
          error: new UserRejected('Window Closed'),
        });
        this.closeWindow(windowId);
      }
    });
  }

  private trackOpenedWindows() {
    this.emitter.on('open', ({ requestId, windowId, id }) => {
      this.pendingWindows.set(requestId, { windowId, id });
    });
    this.emitter.on('settle', ({ id, windowId }) => {
      let windowRequestId: string | undefined = undefined;
      if (id) {
        windowRequestId = this.getRequestId(id);
      } else if (windowId) {
        windowRequestId = this.getRequestIdByWindowId(windowId);
      }
      if (windowRequestId) {
        this.pendingWindows.delete(windowRequestId);
      }
    });
  }

  // async ready() {
  //   await super.ready(); // PersistentStore;
  //   // now verify that windows from setState are still opened
  //   // if not, purge from state
  // }

  private getNewId() {
    return nanoid();
  }

  private getRequestId(id: string): string | undefined {
    return this.requestIds.get(id);
  }

  private getRequestIdByWindowId(windowId: number) {
    const id = Array.from(this.idsMap.keys()).find(
      (key) => this.idsMap.get(key) === windowId
    );
    if (id) {
      return this.getRequestId(id);
    }
  }

  private async createBrowserWindow({
    top,
    left,
    width = DEFAULT_WINDOW_SIZE.width,
    height = DEFAULT_WINDOW_SIZE.height,
    route: initialRoute,
    search,
  }: WindowProps) {
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

    if (!windowId) {
      throw new Error('Window ID not recevied from the window API.');
    }

    return { id, windowId };
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    this.emitter.emit(event, ...args);
  }

  async open<T>({
    requestId,
    route,
    search,
    onDismiss,
    onResolve,
    width,
    height,
    left,
    top,
  }: WindowProps & {
    requestId: string;
    onDismiss: (error?: ErrorResponse) => void;
    onResolve: (data: T) => void;
  }) {
    const unlisten = this.emitter.on(
      'settle',
      ({ status, id, windowId, result, error }) => {
        let windowRequestId: string | undefined = undefined;
        if (id) {
          windowRequestId = this.getRequestId(id);
        } else if (windowId) {
          windowRequestId = this.getRequestIdByWindowId(windowId);
        }
        if (windowRequestId === requestId) {
          if (status === 'fulfilled') {
            onResolve(result as T);
          } else if (status === 'rejected') {
            onDismiss(error);
          }
          unlisten();
        }
      }
    );
    if (this.pendingWindows.has(requestId)) {
      // Window is already opened for this request and all necessary listeners
      // have been set up, so we're done.
      return;
    }

    const { id, windowId } = await this.createBrowserWindow({
      top,
      left,
      width,
      height,
      route,
      search,
    });
    this.emitter.emit('open', { requestId, windowId, id });
    this.requestIds.set(id, requestId);
    this.idsMap.set(id, windowId);
  }

  closeCurrentWindow() {
    if (this.windowId != null) {
      browser.windows.remove(this.windowId);
    }
  }
}

// Make it a singleton so that windows do not conflict
export const notificationWindow = new NotificationWindow();
