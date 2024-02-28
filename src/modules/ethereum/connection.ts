import EventEmitter from 'events';
import type {
  IJsonRpcConnection,
  JsonRpcPayload,
  JsonRpcResult,
} from '@json-rpc-tools/utils';
import { isJsonRpcError, isJsonRpcResponse } from '@json-rpc-tools/utils';

export class Connection extends EventEmitter implements IJsonRpcConnection {
  public events = new EventEmitter();

  broadcastChannel: BroadcastChannel;
  connected = false;
  connecting = false;

  constructor(broadcastChannel: BroadcastChannel) {
    super();

    this.broadcastChannel = broadcastChannel;
    this.broadcastChannel.addEventListener('message', (event) => {
      if (event.data?.type === 'ethereumEvent') {
        this.emit('ethereumEvent', {
          event: event.data.event,
          value: event.data.value,
        });
      } else if (event.data?.type === 'walletEvent') {
        this.emit('walletEvent', {
          event: event.data.event,
          value: event.data.value,
        });
      } else {
        this.emit('payload', event.data);
      }
    });
  }

  async open() {
    return Promise.resolve().then(() => {
      this.connected = true;
    });
  }

  async close() {
    return Promise.resolve();
  }

  send<Result = unknown>(payload: JsonRpcPayload): Promise<Result> {
    this.broadcastChannel.postMessage(payload);
    return this.getPromise<Result>(payload.id);
  }

  getPromise<T>(id: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent<JsonRpcResult>) => {
        const { data } = event;
        if (data.id === id && isJsonRpcResponse(data)) {
          if (isJsonRpcError(data)) {
            reject(data.error);
          } else {
            resolve(data.result);
          }
          this.broadcastChannel.removeEventListener('message', handler);
        }
      };
      this.broadcastChannel.addEventListener('message', handler);
    });
  }
}
