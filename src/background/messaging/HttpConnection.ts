import EventEmitter from 'events';
import {
  formatJsonRpcError,
  isJsonRpcRequest,
  JsonRpcError,
  JsonRpcPayload,
  JsonRpcResult,
} from '@json-rpc-tools/utils';
import { Account } from '../account/Account';

export class HttpConnection extends EventEmitter {
  url: string;
  account: Account;

  constructor(url: string, account: Account) {
    super();
    this.url = url;
    this.account = account;
  }

  send(request: JsonRpcPayload): Promise<JsonRpcResult | JsonRpcError> {
    if (!isJsonRpcRequest(request)) {
      console.log('not a request:', request); // eslint-disable-line no-console
      return Promise.reject('not a request');
    }
    return fetch(this.url, {
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
