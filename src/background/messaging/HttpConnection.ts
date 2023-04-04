import EventEmitter from 'events';
import ky from 'ky';
import {
  formatJsonRpcError,
  isJsonRpcRequest,
  JsonRpcError,
  JsonRpcPayload,
  JsonRpcResult,
} from '@json-rpc-tools/utils';
import { networksStore } from 'src/modules/networks/networks-store.background';

export class HttpConnection extends EventEmitter {
  private chainId: string;

  constructor({ chainId }: { chainId: string }) {
    super();
    /** TODO: Should we save just the URL instead of chainId? */
    this.chainId = chainId;
  }

  async send(
    request: JsonRpcPayload,
    _context: unknown
  ): Promise<JsonRpcResult | JsonRpcError> {
    if (!isJsonRpcRequest(request)) {
      console.log('not a request:', request); // eslint-disable-line no-console
      return Promise.reject('not a request');
    }
    const networks = await networksStore.load();

    const chain = networks.getChainById(this.chainId);
    const url = networks.getRpcUrlPublic(chain);
    return ky(url, {
      timeout: 20000,
      retry: 1,
      method: 'post',
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
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
