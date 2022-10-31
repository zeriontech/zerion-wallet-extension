import { notificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import { isRpcError, isRpcRequest, isRpcResult } from 'src/shared/custom-rpc';
import type { PortMessageHandler } from '../PortRegistry';

export function createNotificationWindowMessageHandler(): PortMessageHandler {
  return function notificationWindowMessageHandler(port, msg) {
    if (port.name !== 'window') {
      return;
    }

    if (isRpcResult(msg)) {
      notificationWindow.emit('resolve', msg);
    } else if (isRpcError(msg)) {
      notificationWindow.emit('reject', msg);
    } else if (isRpcRequest(msg)) {
      if (msg.method === 'closeCurrentWindow') {
        notificationWindow.closeCurrentWindow();
      }
    } else {
      return false;
    }

    return true;
  };
}
