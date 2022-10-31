import { ErrorResponse } from '@json-rpc-tools/utils';
import EventEmitter from 'events';
import { nanoid } from 'nanoid';
import type { RpcError, RpcResult } from 'src/shared/custom-rpc';
import { UserRejected } from 'src/shared/errors/errors';
import { windowManager } from '../webapis/window';

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
  }: {
    route: string;
    search?: string;
    onDismiss: (error?: ErrorResponse) => void;
    onResolve: (data: T) => void;
  }) {
    if (this.windowId != null) {
      windowManager.remove(this.windowId);
    }

    const disposables: Array<() => void> = [];

    const onDone = () => {
      disposables.forEach((dispose) => dispose());
    };

    let route = initialRoute;
    const id = this.getNewId();
    const params = new URLSearchParams(search);
    params.append('windowId', String(id));
    route = route + `?${params.toString()}`;
    const windowId = await windowManager.openNotification({ route });
    if (windowId) {
      this.idsMap.set(id, windowId);
      disposables.push(() => this.idsMap.delete(id));
    }
    this.windowId = windowId;
    disposables.push(() => {
      if (this.windowId != null) {
        windowManager.remove(this.windowId);
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
      if (this.windowId === windowId) {
        this.windowId = null;
      }
      onDismiss(new UserRejected('Window Closed'));
      onDone();
    };
    windowManager.event.on('windowRemoved', handleWindowRemoved);
    disposables.push(() => {
      windowManager.event.off('windowRemoved', handleWindowRemoved);
    });

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
      windowManager.remove(this.windowId);
    }
  }
}

// Make it a singleton so that windows do not conflict
export const notificationWindow = new NotificationWindow();
Object.assign(window, { notificationWindow });
