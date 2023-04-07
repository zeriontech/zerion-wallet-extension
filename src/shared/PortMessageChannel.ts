import browser from 'webextension-polyfill';
import {
  formatJsonRpcRequest,
  isJsonRpcPayload,
  isJsonRpcResponse,
  isJsonRpcResult,
} from '@json-rpc-tools/utils';
import type { JsonRpcPayload } from '@json-rpc-tools/utils';

type Port = browser.Runtime.Port;
export class PortMessageChannel {
  port: Port | undefined;
  name: string;

  constructor({ name }: { name: string }) {
    this.name = name;
  }

  initialize() {
    this.port = browser.runtime.connect({ name: this.name });
    this.port.onDisconnect.addListener(() => {
      this.port = undefined;
    });
  }

  private verifyPort(port: Port | undefined): asserts port is Port {
    if (!port) {
      throw new Error(
        `Cannot use port before it's been initialized: (${this.name})`
      );
    }
  }

  async request<Method extends string, Params, Result>(
    method: Method,
    params: Params
  ) {
    this.verifyPort(this.port);
    const payload = formatJsonRpcRequest(method, params);
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
            this.verifyPort(this.port);
            this.port.onMessage.removeListener(handler);
          }
        }
      };
      this.verifyPort(this.port);
      this.port.onMessage.addListener(handler);
    });
  }
}
