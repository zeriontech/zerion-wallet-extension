import {
  isJsonRpcError,
  isJsonRpcPayload,
  isJsonRpcRequest,
  isJsonRpcResult,
} from '@json-rpc-tools/utils';
import { notificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import type { PortMessageHandler } from '../PortRegistry';

export function createNotificationWindowMessageHandler(): PortMessageHandler {
  return function notificationWindowMessageHandler(port, msg) {
    if (port.name !== 'window') {
      return;
    }
    if (!isJsonRpcPayload(msg)) {
      return;
    }

    if (isJsonRpcResult(msg)) {
      notificationWindow.emit('resolve', msg);
    } else if (isJsonRpcError(msg)) {
      notificationWindow.emit('reject', msg);
    } else if (isJsonRpcRequest(msg)) {
      if (msg.method === 'closeCurrentWindow') {
        notificationWindow.closeCurrentWindow();
      }
    }
    return true;
  };
}
