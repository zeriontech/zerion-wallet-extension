import EventEmitter from 'events';
import {
  formatJsonRpcError,
  isJsonRpcRequest,
  JsonRpcPayload,
} from '@json-rpc-tools/utils';
import type { ChannelContext } from 'src/shared/types/ChannelContext';
import { Account } from '../account/Account';
import { formatJsonRpcResultForPort } from 'src/shared/formatJsonRpcResultForPort';

export class HttpConnection extends EventEmitter {
  url: string;
  account: Account;

  constructor(url: string, account: Account) {
    super();
    this.url = url;
    this.account = account;
  }

  send(request: JsonRpcPayload, context?: Partial<ChannelContext>): void {
    if (!isJsonRpcRequest(request)) {
      console.log('not a request:', request); // eslint-disable-line no-console
      return;
    }
    const wallet = this.account.getCurrentWallet();
    if (!wallet) {
      throw new Error('Wallet does not exist yet');
    }
    const method = wallet[request.method as keyof typeof wallet];
    if (method && typeof method === 'function') {
      method
        .call(wallet, {
          params: request.params,
          context,
        })
        .then(
          (result) => {
            this.emit(
              'payload',
              formatJsonRpcResultForPort(request.id, result)
            );
          },
          (error: Error) => {
            const payload = formatJsonRpcError(request.id, error.message);
            console.log('wallet request err', payload);
            this.emit('payload', payload);
          }
        );
    } else {
      fetch(this.url, {
        method: 'post',
        body: JSON.stringify(request),
      })
        .then((r) => r.json())
        .then(
          (result) => {
            this.emit('payload', result);
          },
          (error: Error) => {
            const payload = formatJsonRpcError(request.id, error.message);
            this.emit('payload', payload);
          }
        );
    }
  }
}
