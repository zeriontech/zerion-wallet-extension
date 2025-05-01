import EventEmitter from 'events';
import type {
  IJsonRpcConnection,
  JsonRpcPayload,
  JsonRpcResult,
} from '@walletconnect/jsonrpc-utils';
import {
  isJsonRpcError,
  isJsonRpcResponse,
} from '@walletconnect/jsonrpc-utils';
import type {
  ExtractChannelMethods,
  RPCApi,
} from 'src/ui/shared/channels.types';
import type { Wallet } from 'src/shared/types/Wallet';
import { formatJsonRpcRequestPatched } from 'src/shared/custom-rpc/formatJsonRpcRequestPatched';

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

  rpcRequest = (async (method: string, params: unknown) => {
    return this.send(formatJsonRpcRequestPatched(method, params || []));
  }) as RPCApi<
    ExtractChannelMethods<Wallet['publicEthereumController']>
  >['request'];

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
