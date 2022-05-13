import {
  formatJsonRpcRequest,
  isJsonRpcPayload,
  isJsonRpcResponse,
  isJsonRpcResult,
} from '@json-rpc-tools/utils';
import type { JsonRpcPayload } from '@json-rpc-tools/utils';

export class PortMessageChannel {
  port: chrome.runtime.Port;

  constructor({ name }: { name: string }) {
    this.port = chrome.runtime.connect({ name });
    this.port.onMessage.addListener(console.log);
  }

  request<Method extends string, Params, Result>(
    method: Method,
    params: Params,
    id?: number
  ) {
    const payload = formatJsonRpcRequest(method, params, id);
    this.port.postMessage(payload);
    return this.getPromise<Result>(payload.id);
  }

  getPromise<Result>(id: number): Promise<Result> {
    return new Promise((resolve, reject) => {
      const handler = (msg: JsonRpcPayload | unknown) => {
        if (isJsonRpcPayload(msg) && isJsonRpcResponse(msg)) {
          if (msg.id === id) {
            if (isJsonRpcResult(msg)) {
              resolve(msg.result);
            } else {
              reject(msg.error);
            }
            this.port.onMessage.removeListener(handler);
          }
        }
      };
      this.port.onMessage.addListener(handler);
    });
  }
}
