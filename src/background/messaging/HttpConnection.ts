import EventEmitter from 'events';
import ky from 'ky';
import type {
  JsonRpcError,
  JsonRpcPayload,
  JsonRpcResult,
} from '@walletconnect/jsonrpc-utils';
import {
  formatJsonRpcError,
  isJsonRpcRequest,
} from '@walletconnect/jsonrpc-utils';
import { networksStore } from 'src/modules/networks/networks-store.background';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';

export class HttpConnection extends EventEmitter {
  private chainId: ChainId;

  constructor({ chainId }: { chainId: ChainId }) {
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
    const networks = await networksStore.loadNetworksWithChainId(this.chainId);

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
