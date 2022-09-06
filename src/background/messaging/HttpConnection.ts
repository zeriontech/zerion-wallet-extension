import EventEmitter from 'events';
import {
  formatJsonRpcError,
  isJsonRpcRequest,
  JsonRpcError,
  JsonRpcPayload,
  JsonRpcResult,
} from '@json-rpc-tools/utils';
import { networksStore } from 'src/modules/networks/networks-store';
import type { ChannelContext } from 'src/shared/types/ChannelContext';
import type { Wallet } from '../Wallet/Wallet';

export class HttpConnection extends EventEmitter {
  private walletGetter: () => Wallet;

  constructor(getWallet: () => Wallet) {
    super();
    this.walletGetter = getWallet;
  }

  async send(
    request: JsonRpcPayload,
    context: Partial<ChannelContext>
  ): Promise<JsonRpcResult | JsonRpcError> {
    if (!isJsonRpcRequest(request)) {
      console.log('not a request:', request); // eslint-disable-line no-console
      return Promise.reject('not a request');
    }
    const networks = await networksStore.load();
    const wallet = this.walletGetter();
    const chainId = await wallet.publicEthereumController.eth_chainId({
      context,
    });

    const chain = networks.getChainById(chainId);
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
