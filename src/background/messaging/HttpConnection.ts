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

export class HttpConnection extends EventEmitter {
  private url: string;

  constructor({ url }: { url: string }) {
    super();
    this.url = url;
  }

  async send(request: JsonRpcPayload): Promise<JsonRpcResult | JsonRpcError> {
    if (!isJsonRpcRequest(request)) {
      console.log('not a request:', request); // eslint-disable-line no-console
      return Promise.reject('not a request');
    }

    return ky(this.url, {
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
