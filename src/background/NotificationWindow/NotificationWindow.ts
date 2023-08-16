import { createNanoEvents } from 'nanoevents';
import type { ErrorResponse } from '@json-rpc-tools/utils';
import browser from 'webextension-polyfill';
import type { RpcError, RpcResult } from 'src/shared/custom-rpc';
import { UserRejected } from 'src/shared/errors/errors';
import { PersistentStore } from 'src/modules/persistent-store';
import { produce } from 'immer';
import {
  checkTabForFishing,
  openFishingWarning,
} from 'src/modules/fishing-defence/fishing-defence-api';
import type { WindowProps } from './createBrowserWindow';
import { createBrowserWindow } from './createBrowserWindow';

const emitter = createNanoEvents<{
  windowRemoved: (windowId: number) => void;
}>();

browser.windows.onRemoved.addListener((windowId) => {
  emitter.emit('windowRemoved', windowId);
});

interface Events {
  resolve: (value: RpcResult) => void;
  reject: (value: RpcError) => void;
  open: (value: { requestId: string; windowId: number; id: string }) => void;
  /**
   * "settle" is a helper event that can be listened to
   * when you need to respond any of the "close" events, such as
   * "resolve", "reject" and "windowRemoved"
   */
  settle: (value: {
    status: 'fulfilled' | 'rejected';
    result?: unknown;
    error?: ErrorResponse;
    id?: string;
    windowId?: number;
  }) => void;
}

type PendingState = Record<string, { windowId: number; id: string }>;

export class NotificationWindow extends PersistentStore<PendingState> {
  static initialState: PendingState = {};
  static key = 'notificationWindow';

  private events = createNanoEvents<Events>();
  private idsMap: Map<string, number>;
  private requestIds: Map<string, string> = new Map();

  constructor(
    initialState = NotificationWindow.initialState,
    key = NotificationWindow.key
  ) {
    super(initialState, key);
    this.idsMap = new Map();
    this.trackOpenedWindows();
    this.trackWindowEvents();
  }

  private async removeStaleEntries() {
    // Verify that window entries recovered from storage are still opened.
    // If not, purge from state
    const pendingWindows = this.getState();
    const pendingWindowIds = Object.values(pendingWindows).map(
      (entry) => entry.windowId
    );
    const windowQueries = await Promise.allSettled(
      pendingWindowIds.map((id) => browser.windows.get(id))
    );
    const existingWindows = windowQueries
      .filter(
        <T>(
          result: PromiseSettledResult<T>
        ): result is PromiseFulfilledResult<T> => result.status === 'fulfilled'
      )
      .map((result) => result.value.id);
    const existingWindowsSet = new Set(existingWindows);
    this.setState((state) =>
      produce(state, (draft) => {
        for (const key in draft) {
          if (!existingWindowsSet.has(draft[key].windowId)) {
            delete draft[key];
          }
        }
      })
    );
  }

  async initialize() {
    await super.ready(); // PersistentStore;
    await this.removeStaleEntries();
    const pendingWindows = this.getState();
    for (const key in pendingWindows) {
      const entry = pendingWindows[key];
      this.idsMap.set(entry.id, entry.windowId);
      this.requestIds.set(entry.id, key);
    }
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
    // NOTE: idsMap can be refactored into a bidirectional map
    // so that these searches are more elegant
    const id = Array.from(this.idsMap.keys()).find(
      (id) => this.idsMap.get(id) === windowId
    );
    if (id) {
      this.idsMap.delete(id);
      this.requestIds.delete(id);
    }
  }

  private trackWindowEvents() {
    /**
     * When background script reloads, both the content-script and the ui-script
     * will re-send their port requests. If the "reject" or "resolve" re-request from the
     * UI comes earlier than the re-request from the content-script (dapp),
     * then we will close the window before the `open` method is invoked, therefore
     * the window will be closed and then re-opened, requiring the user to press the button again.
     * To avoid this, we add a timeout so that the re-request from the dapp is handled first.
     * Since this logic is very specific to our dialog window flow, I think this
     * timeout belongs here and not in the other files.
     */
    this.events.on('resolve', ({ id, result }) => {
      setTimeout(() => {
        this.events.emit('settle', { status: 'fulfilled', id, result });
        this.closeWindowById(id);
      }, 16);
    });
    this.events.on('reject', ({ id, error }) => {
      setTimeout(() => {
        this.events.emit('settle', { status: 'rejected', id, error });
        this.closeWindowById(id);
      }, 16);
    });
    emitter.on('windowRemoved', (windowId) => {
      // This event can be triggered as a consequence of our own closeWindow
      // methods. We should check that this `windowId` hasn't been removed
      if (
        Array.from(this.idsMap.values()).some((value) => value === windowId)
      ) {
        this.events.emit('settle', {
          status: 'rejected',
          windowId,
          error: new UserRejected('Window Closed'),
        });
        this.closeWindow(windowId);
      }
    });
  }

  private trackOpenedWindows() {
    this.events.on('open', ({ requestId, windowId, id }) => {
      this.setState((state) =>
        produce(state, (draft) => {
          draft[requestId] = { windowId, id };
        })
      );
    });
    this.events.on('settle', ({ id, windowId }) => {
      let windowRequestId: string | undefined = undefined;
      if (id) {
        windowRequestId = this.getRequestId(id);
      } else if (windowId) {
        windowRequestId = this.getRequestIdByWindowId(windowId);
      }
      if (windowRequestId) {
        this.setState((state) =>
          produce(state, (draft) => {
            // this condition is for typescript :(
            if (windowRequestId) {
              delete draft[windowRequestId];
            }
          })
        );
      }
    });
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

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    this.events.emit(event, ...args);
  }

  async open<T>({
    requestId,
    route,
    search,
    onDismiss,
    onResolve,
    origin,
    width,
    height,
    left,
    top,
  }: WindowProps & {
    origin?: string;
    requestId: string;
    onDismiss: (error?: ErrorResponse) => void;
    onResolve: (data: T) => void;
  }) {
    const unlisten = this.events.on(
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
    const pendingWindows = this.getState();
    if (pendingWindows[requestId]) {
      // Window is already opened for this request and all necessary listeners
      // have been set up, so we're done.
      return;
    }

    const { id, windowId } = await createBrowserWindow({
      top,
      left,
      width,
      height,
      route,
      search,
    });
    this.events.emit('open', { requestId, windowId, id });
    this.requestIds.set(id, requestId);
    this.idsMap.set(id, windowId);
    if (origin) {
      checkTabForFishing(origin).then((result) => {
        if (result && windowId) {
          this.events.emit('reject', {
            id,
            error: new UserRejected('Malicious DApp'),
          });
          setTimeout(() => openFishingWarning(), 100);
        }
      });
    }
  }

  /** @deprecated */
  closeCurrentWindow() {
    console.warn('deprecated'); // eslint-disable-line no-console
  }
}
