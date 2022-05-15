import { isJsonRpcPayload, isJsonRpcRequest } from '@json-rpc-tools/utils';
import type { HttpConnection } from '../HttpConnection';
import type { PortMessageHandler } from '../PortRegistry';

export function createHttpConnectionMessageHandler(
  httpConnection: HttpConnection
): PortMessageHandler {
  return function httpConnectionMessageHandler(port, msg) {
    if (port.name !== `${chrome.runtime.id}/ethereum`) {
      return;
    }
    if (isJsonRpcPayload(msg) && isJsonRpcRequest(msg)) {
      httpConnection.send(msg).then((result) => {
        port.postMessage(result);
      });
      return true;
    }
  };
}
