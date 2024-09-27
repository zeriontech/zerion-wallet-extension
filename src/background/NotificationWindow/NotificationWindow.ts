import { createNanoEvents } from 'nanoevents';
import { nanoid } from 'nanoid';
import type { ErrorResponse } from '@walletconnect/jsonrpc-utils';
import browser from 'webextension-polyfill';
import type { RpcError, RpcResult } from 'src/shared/custom-rpc';
import { UserRejected } from 'src/shared/errors/errors';
import { PersistentStore } from 'src/modules/persistent-store';
import { produce } from 'immer';
import { isSidepanelOpen } from 'src/shared/sidepanel/sidepanel-messaging.background';
import { getSidepanelUrl } from 'src/shared/getPopupUrl';
import type { Brand } from 'src/shared/type-utils/Brand';
import { emitter as globalEmitter } from '../events';
import type { WindowProps } from './createBrowserWindow';
import { createBrowserWindow } from './createBrowserWindow';

const emitter = createNanoEvents<{
  windowRemoved: (windowId: number) => void;
}>();

browser.windows.onRemoved.addListener((windowId) => {
  emitter.emit('windowRemoved', windowId);
});

/** Identifies RPC-request coming from the dapp in form of `${dappOrigin}:${rpcId}` */
type DappRpcRequestId = Brand<string, 'NotificationWindow:DappRpcRequestId'>;
/** Internal request id passed as a search param to the UI dialog */
type InternalRequestId = Brand<
  `sidepanel:${string}` | string,
  'NotificationWindow:InternalRequestId'
>;

interface Events {
  resolve: (value: RpcResult) => void;
  reject: (value: RpcError) => void;
  open: (value: {
    requestId: DappRpcRequestId;
    windowId: number;
    id: InternalRequestId;
    tabId: number | null;
  }) => void;
  /**
   * "settle" is a helper event that can be listened to
   * when you need to respond any of the "close" events, such as
   * "resolve", "reject" and "windowRemoved"
   */
  settle: (value: {
    status: 'fulfilled' | 'rejected';
    result?: unknown;
    error?: ErrorResponse;
    /** missing id in "settle" event indicates that the whole window has been closed manually */
    id?: InternalRequestId;
    windowId?: number;
  }) => void;
}

type PendingState = Record<
  DappRpcRequestId,
  {
    /** windowId values are NOT unique between entries (sidepanel flow) */
    windowId: number;
    id: InternalRequestId;
    /** tabId is required for sidepanel dialog */
    tabId: number | null;
  }
>;

export type NotificationWindowProps<T> = Omit<WindowProps, 'type'> & {
  type?: WindowProps['type'];
  tabId: number | null;
  requestId: string;
  onDismiss: (error?: ErrorResponse) => void;
  onResolve: (data: T) => void;
};

async function analyzeSidepanelEntries(state: PendingState) {
  const staleRequestIds = new Set<string>();

  for (const requestIdUntyped in state) {
    const requestId = requestIdUntyped as DappRpcRequestId;
    const entry = state[requestId];
    if (!entry.id.startsWith('sidepanel:')) {
      continue;
    }
    staleRequestIds.add(requestId); // mark each requestId as stale initially
    try {
      const { tabs = [] } = await browser.windows.get(entry.windowId, {
        populate: true,
      });
      for (const tab of tabs) {
        if (tab.id) {
          const { path, enabled } = await chrome.sidePanel.getOptions({
            tabId: tab.id,
          });
          if (enabled && path) {
            const url = new URL(path);
            const windowId = url.searchParams.get('windowId');
            if (windowId === entry.id) {
              // Not stale!
              staleRequestIds.delete(requestId);
            }
          }
        }
      }
    } catch {
      // window not found, requestId will be marked as stale
    }
  }
  return { staleRequestIds };
}

export class NotificationWindow extends PersistentStore<PendingState> {
  static initialState: PendingState = {};
  static key = 'notificationWindow';

  private events = createNanoEvents<Events>();

  constructor(
    initialState = NotificationWindow.initialState,
    key = NotificationWindow.key
  ) {
    super(initialState, key);
    this.trackOpenedWindows();
    this.trackWindowEvents();
  }

  /**
   * Removes from {@type PendingState} all entries where {PendingState[string]['windowId']}
   * is not found among opened browser windows
   * NOTE:
   * For sidepanel entries (e.g. { id: 'sidepanel:...', windowId: N }), windowId may still exist,
   * but sidepanel may have been closed. We query all tabs and for each call
   * `sidePanel.getOptions({ tabId })` to see if there is a sidepanel opened with pathname with
   * a pending request
   */
  private async removeStaleEntries() {
    // Verify that window entries recovered from storage are still opened.
    // If not, purge from state
    const pendingWindows = this.getState();
    const { staleRequestIds: staleSidepanelRequestIds } =
      await analyzeSidepanelEntries(pendingWindows);
    const values = Object.values(pendingWindows);
    const pendingWindowIds = values.map((entry) => entry.windowId);
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
        for (const keyUntyped in draft) {
          const key = keyUntyped as DappRpcRequestId;
          if (!existingWindowsSet.has(draft[key].windowId)) {
            delete draft[key];
          } else if (staleSidepanelRequestIds.has(key)) {
            delete draft[key];
          }
        }
      })
    );
  }

  async initialize() {
    await super.ready(); // PersistentStore;
    await this.removeStaleEntries();
  }

  private closeWindowById(id: InternalRequestId) {
    const windowId = this.getWindowIdByInternalId(id);
    const isSidepanel = id.startsWith('sidepanel:');
    if (windowId && !isSidepanel) {
      browser.windows.remove(windowId);
    } else if (isSidepanel) {
      // For sidepanel, we maybe do not need to close it.
      // Currently we only show Dapp Request in sidepanel if it already was open,
      // so it doesn't need to be closed after. But if this pattern changes,
      // this is the place to close it
      // console.log('maybe close sidepanel');
    }
  }

  private closeWindow(windowId: number) {
    browser.windows.remove(windowId).catch(() => {
      // Ignore error: window may have been closed manually already
    });
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
    this.events.on('resolve', ({ id: idRaw, result }) => {
      const id = idRaw as InternalRequestId;
      const status = 'fulfilled';
      setTimeout(() => {
        this.closeWindowById(id);
        this.events.emit('settle', { status, id, result });
      }, 16);
    });
    this.events.on('reject', ({ id: idRaw, error }) => {
      const id = idRaw as InternalRequestId;
      const status = 'rejected';
      setTimeout(() => {
        this.closeWindowById(id);
        this.events.emit('settle', { status, id, error });
      }, 16);
    });
    emitter.on('windowRemoved', (windowId) => {
      // This event can be triggered as a consequence of our own closeWindow
      // methods. We should check that this `windowId` hasn't been removed
      const state = this.getState();
      if (Object.values(state).some((entry) => entry.windowId === windowId)) {
        this.events.emit('settle', {
          status: 'rejected',
          windowId,
          error: new UserRejected('Window Closed'),
        });
        this.closeWindow(windowId);
      }
    });
    globalEmitter.on('uiClosed', ({ url }) => {
      if (!url) {
        return;
      }
      const idRaw = new URLSearchParams(new URL(url).hash).get('windowId');
      const id = idRaw as InternalRequestId;
      const status = 'rejected';
      const error = new UserRejected('Sidepanel Closed');
      if (id) {
        this.events.emit('settle', { status, id, error });
      }
    });
  }

  private trackOpenedWindows() {
    this.events.on('open', ({ requestId, windowId, id, tabId }) => {
      this.setState((state) =>
        produce(state, (draft) => {
          draft[requestId] = { windowId, id, tabId };
        })
      );
    });
    this.events.on('settle', async ({ id, windowId }) => {
      const matchingRequestIds = this.getMatchingRequestIds({ id, windowId });
      // Delay: let other code react to 'settle' first before cleaning up PendingState
      await new Promise((r) => setTimeout(r, 16));
      if (id?.startsWith('sidepanel:')) {
        const entry = Object.values(this.getState()).find(
          (entry) => entry.id === id
        );
        if (entry && entry.tabId) {
          try {
            const sidepanelPath = getSidepanelUrl();
            // reset sidepanel path so that when user re-opens it,
            // it doesn't open on the "dialog" route
            await chrome.sidePanel.setOptions({
              path: sidepanelPath.toString(),
            });
          } catch {
            // eslint-disable-next-line no-console
            console.warn(
              `could not reset sidepanel options after settle for tabId: ${entry.tabId}`
            );
          }
        }
      }
      if (matchingRequestIds.length) {
        this.setState((state) =>
          produce(state, (draft) => {
            for (const requestId of matchingRequestIds) {
              delete draft[requestId];
            }
          })
        );
      }
    });
  }

  private getWindowIdByInternalId(value: InternalRequestId) {
    const state = this.getState();
    for (const { windowId, id } of Object.values(state)) {
      if (id === value) {
        return windowId;
      }
    }
  }

  private getRequestId(id: InternalRequestId): DappRpcRequestId | undefined {
    const state = this.getState();
    for (const requestIdUntyped in state) {
      const requestId = requestIdUntyped as DappRpcRequestId;
      if (state[requestId].id === id) {
        return requestId;
      }
    }
  }

  /**
   * Several requests may share the same windowId
   */
  private getRequestIdsByWindowId(windowId: number): DappRpcRequestId[] {
    const state = this.getState();
    return Object.entries(state)
      .filter(([_key, entry]) => entry.windowId === windowId)
      .map(([key]) => key as DappRpcRequestId);
  }

  private getMatchingRequestIds({
    id,
    windowId,
  }: {
    id?: InternalRequestId;
    windowId?: number;
  }) {
    if (id) {
      const requestId = this.getRequestId(id);
      return requestId ? [requestId] : [];
    } else if (windowId) {
      return this.getRequestIdsByWindowId(windowId);
    } else {
      return [];
    }
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    this.events.emit(event, ...args);
  }

  async open<T>({
    requestId: requestIdRaw,
    route,
    type = 'dialog',
    search,
    tabId,
    onDismiss,
    onResolve,
    width,
    height,
  }: NotificationWindowProps<T>) {
    const requestId = requestIdRaw as DappRpcRequestId;
    const unlisten = this.events.on(
      'settle',
      ({ status, id, windowId, result, error }) => {
        const matchingRequestIds = this.getMatchingRequestIds({ id, windowId });
        if (matchingRequestIds.includes(requestId)) {
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
      return pendingWindows[requestId].id;
    }

    const tabWhereRequestComesFrom = tabId
      ? await browser.tabs.get(tabId)
      : null;
    const sidepanelIsOpen = await isSidepanelOpen({
      windowId: tabWhereRequestComesFrom?.windowId ?? null,
    });
    const windowId = tabWhereRequestComesFrom?.windowId;
    const browserWindow = windowId ? await browser.windows.get(windowId) : null;
    // NOTE: Only use sidepanel if request comes from the currently active tab
    // and this tab has a sidepanel opened
    // NOTE: Tab may be active inside a non-active window. If we were able to show the request
    // only in sidepanel related to that tab, it would be okay to use it. But because it seems that
    // we cannot set options to sidepanel per-tab without leading to undesired behaviors (browser will keep
    // automatically opening the sidepanel when that tab is activated), it seems that it's better to
    // check that both window and tab where request comes from are active ("focused")
    if (
      tabWhereRequestComesFrom?.active &&
      tabWhereRequestComesFrom.id &&
      tabWhereRequestComesFrom.windowId &&
      browserWindow?.focused &&
      sidepanelIsOpen
    ) {
      const sidepanelPath = getSidepanelUrl();
      const searchParams = new URLSearchParams(search);
      const id = `sidepanel:${nanoid()}` as InternalRequestId;
      sidepanelPath.searchParams.append('windowId', id);
      searchParams.append('windowId', id);
      sidepanelPath.hash = `${route}?${searchParams}`;
      const tabId = tabWhereRequestComesFrom.id;
      chrome.sidePanel.setOptions({
        path: sidepanelPath.toString(),
      });
      const windowId = tabWhereRequestComesFrom.windowId;
      this.events.emit('open', { requestId, windowId, id, tabId });
      return id;
    } else {
      const { id: idRaw, windowId } = await createBrowserWindow({
        width,
        height,
        route,
        type,
        search,
      });
      const id = idRaw as InternalRequestId;
      this.events.emit('open', { requestId, windowId, id, tabId: null });
      return id;
    }
  }

  /** @deprecated */
  closeCurrentWindow() {
    console.warn('deprecated'); // eslint-disable-line no-console
  }
}
