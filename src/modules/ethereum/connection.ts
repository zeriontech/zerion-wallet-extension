import EventEmitter from 'events';
import type { IJsonRpcConnection, JsonRpcPayload } from '@json-rpc-tools/utils';

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

  send(payload: JsonRpcPayload): Promise<void> {
    this.broadcastChannel.postMessage(payload);
    return this.getPromise(payload.id);
  }

  getPromise<T>(id: number): Promise<T> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent<{ id: number; payload: T }>) => {
        const { data } = event;
        if (data.id === id) {
          resolve(data.payload);
          this.broadcastChannel.removeEventListener('message', handler);
        }
      };
      this.broadcastChannel.addEventListener('message', handler);
    });
  }
}
