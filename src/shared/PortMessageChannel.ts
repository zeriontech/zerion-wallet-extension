import browser from 'webextension-polyfill';
import {
  isJsonRpcError,
  isJsonRpcPayload,
  isJsonRpcResponse,
  isJsonRpcResult,
} from '@walletconnect/jsonrpc-utils';
import type {
  JsonRpcPayload,
  JsonRpcRequest,
} from '@walletconnect/jsonrpc-utils';
import { createNanoEvents } from 'nanoevents';
import { invariant } from './invariant';
import { formatJsonRpcRequestPatched } from './custom-rpc/formatJsonRpcRequestPatched';

type Port = browser.Runtime.Port;
export class PortMessageChannel {
  port: Port | undefined;
  name: string;
  private pendingRequests: Map<string | number, JsonRpcRequest> = new Map();
  emitter = createNanoEvents<{
    message: (msg: unknown) => void;
    postMessage: (msg: JsonRpcRequest) => void;
    connect: () => void;
  }>();

  constructor({ name }: { name: string }) {
    this.name = name;
    this.trackPendingRequests();
  }

  initialize() {
    this.port = browser.runtime.connect({ name: this.name });
    this.port.onMessage.addListener((msg) => {
      this.emitter.emit('message', msg);
    });
    this.emitter.emit('connect');
  }

  private trackPendingRequests() {
    /** Save all requests to be able to re-send them after reconnection */
    this.emitter.on('postMessage', (request) => {
      this.pendingRequests.set(request.id, request);
    });
    this.emitter.on('message', (response) => {
      if (isJsonRpcPayload(response)) {
        if (isJsonRpcError(response)) {
          console.group('Port method error'); // eslint-disable-line no-console
          console.table(this.pendingRequests.get(response.id)); // eslint-disable-line no-console
          console.table(response); // eslint-disable-line no-console
          console.groupEnd(); // eslint-disable-line no-console
        }
        this.pendingRequests.delete(response.id);
      }
    });
    this.emitter.on('connect', () => {
      invariant(this.port, 'Port must exist immediately after connect event');
      /** Resend all unresolved requests to the new port */
      for (const request of this.pendingRequests.values()) {
        this.port.postMessage(request);
      }
    });
  }

  async request<Method extends string, Params, Result>(
    method: Method,
    params: Params,
    id?: number
  ) {
    // NOTE: Should we assert this.port _after_ emitting the custom 'postMessage'?
    // Or not assert at all?
    invariant(this.port, `Port not initialized: (${this.name})`);
    const payload = formatJsonRpcRequestPatched(method, params, id);
    this.emitter.emit('postMessage', payload);
    this.port.postMessage(payload);
    return this.getPromise<Result>(payload.id);
  }

  private getPromise<Result>(id: number): Promise<Result> {
    return new Promise((resolve, reject) => {
      const unlisten = this.emitter.on(
        'message',
        (msg: JsonRpcPayload | unknown) => {
          if (isJsonRpcPayload(msg) && isJsonRpcResponse(msg)) {
            if (msg.id === id) {
              if (isJsonRpcResult(msg)) {
                resolve(msg.result);
              } else {
                reject(msg.error);
              }
              unlisten();
            }
          }
        }
      );
    });
  }
}
