import browser from 'webextension-polyfill';
import { isJsonRpcPayload, isJsonRpcRequest } from '@json-rpc-tools/utils';
import { getPortContext } from '../getPortContext';
import type { HttpConnection } from '../HttpConnection';
import type { PortMessageHandler } from '../PortRegistry';

export function createHttpConnectionMessageHandler(
  httpConnection: HttpConnection
): PortMessageHandler {
  return function httpConnectionMessageHandler(port, msg) {
    if (port.name !== `${browser.runtime.id}/ethereum`) {
      return;
    }
    const context = getPortContext(port);
    if (isJsonRpcPayload(msg) && isJsonRpcRequest(msg) && Boolean(msg.method)) {
      httpConnection.send(msg, context).then((result) => {
        port.postMessage(result);
      });
      return true;
    }
  };
}
