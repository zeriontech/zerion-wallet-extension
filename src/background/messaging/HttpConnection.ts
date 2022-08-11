import EventEmitter from 'events';
import {
  formatJsonRpcError,
  isJsonRpcRequest,
  JsonRpcError,
  JsonRpcPayload,
  JsonRpcResult,
} from '@json-rpc-tools/utils';
import { networksStore } from 'src/modules/networks/networks-store';
import { emitter } from '../events';

export class HttpConnection extends EventEmitter {
  chainId: string;

  constructor(initialChainId = '0x1') {
    super();
    this.chainId = initialChainId;
    emitter.on('chainChanged', (chainId) => {
      this.chainId = chainId;
    });
  }

  async send(request: JsonRpcPayload): Promise<JsonRpcResult | JsonRpcError> {
    if (!isJsonRpcRequest(request)) {
      console.log('not a request:', request); // eslint-disable-line no-console
      return Promise.reject('not a request');
    }
    const networks = await networksStore.load();
    const chain = networks.getChainById(this.chainId);
    const url = networks.getRpcUrlInternal(chain);
    return fetch(url, {
      method: 'post',
      body: JSON.stringify(request),
    })
      .then((r) => r.json())
      .then(
        (result) => {
          this.emit('payload', result);
          return result as JsonRpcResult;
        },
        (error: Error) => {
          const payload = formatJsonRpcError(request.id, error.message);
          this.emit('payload', payload);
          return payload;
        }
      );
  }
}
