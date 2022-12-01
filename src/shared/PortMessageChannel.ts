import browser from 'webextension-polyfill';
import {
  formatJsonRpcRequest,
  isJsonRpcPayload,
  isJsonRpcResponse,
  isJsonRpcResult,
} from '@json-rpc-tools/utils';
import type { JsonRpcPayload } from '@json-rpc-tools/utils';

export class PortMessageChannel {
  port: browser.Runtime.Port;

  constructor({ name }: { name: string }) {
    this.port = browser.runtime.connect({ name });
    browser.runtime.onMessage.addListener((request) => {
      if (request.event === 'background-initialized') {
        this.port.disconnect();
        this.port = browser.runtime.connect({ name });
      }
    });
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

  private getPromise<Result>(id: number): Promise<Result> {
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
