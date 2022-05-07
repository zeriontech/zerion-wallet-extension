import EventEmitter from 'events';
import {
  formatJsonRpcError,
  formatJsonRpcResult,
  isJsonRpcRequest,
  JsonRpcPayload,
} from '@json-rpc-tools/utils';
import type { ChannelContext } from 'src/shared/types/ChannelContext';
import { getCurrentWallet } from '../initialize';

export class HttpConnection extends EventEmitter {
  url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  send(request: JsonRpcPayload, context?: Partial<ChannelContext>): void {
    if (!isJsonRpcRequest(request)) {
      console.log('not a request:', request); // eslint-disable-line no-console
      return;
    }
    const wallet = getCurrentWallet();
    if (!wallet) {
      throw new Error('Wallet does not exist yet');
    }
    if (wallet[request.method as keyof typeof wallet]) {
      wallet[request.method as keyof typeof wallet]({
        params: request.params,
        context,
      }).then(
        (result) => {
          this.emit('payload', formatJsonRpcResult(request.id, result));
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
