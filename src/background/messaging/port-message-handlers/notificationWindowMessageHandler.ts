import type { NotificationWindow } from 'src/background/NotificationWindow/NotificationWindow';
import { isRpcRequest } from 'src/shared/custom-rpc';
import { isObj } from 'src/shared/isObj';
import { invariant } from 'src/shared/invariant';
import type { ErrorResponse } from '@walletconnect/jsonrpc-utils';
import type { PortMessageHandler } from '../PortRegistry';

function assertType<T>(
  value: unknown,
  check: (value: unknown) => value is T
): asserts value is T {
  invariant(check(value), 'Type Error');
}

type WindowResolve = { windowId: string; result: unknown };
const isWindowResolve = (v: unknown): v is WindowResolve =>
  isObj(v) && 'windowId' in v && 'result' in v;
type WindowReject = { windowId: string; error: unknown };
const isWindowReject = (v: unknown): v is WindowReject =>
  isObj(v) && 'windowId' in v && 'error' in v;

export function createNotificationWindowMessageHandler(
  notificationWindow: NotificationWindow
): PortMessageHandler {
  return function notificationWindowMessageHandler(port, msg) {
    if (port.name !== 'window') {
      return;
    }

    if (isRpcRequest(msg)) {
      const { params, method } = msg;
      if (method === 'resolve') {
        assertType(params, (v): v is [unknown] => Array.isArray(v));
        assertType(params[0], isWindowResolve);
        notificationWindow.emit('resolve', {
          id: params[0].windowId,
          result: params[0].result,
        });
        port.postMessage({ id: msg.id, result: null });
      } else if (msg.method === 'reject') {
        assertType(params, (v): v is [unknown] => Array.isArray(v));
        assertType(params[0], isWindowReject);
        notificationWindow.emit('reject', {
          id: params[0].windowId,
          error: params[0].error as ErrorResponse,
        });
        port.postMessage({ id: msg.id, result: null });
      } else if (msg.method === 'closeCurrentWindow') {
        notificationWindow.closeCurrentWindow();
      }
    } else {
      return false;
    }

    return true;
  };
}
