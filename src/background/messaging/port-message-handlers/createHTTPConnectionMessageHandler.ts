import browser from 'webextension-polyfill';
import {
  formatJsonRpcError,
  isJsonRpcPayload,
  isJsonRpcRequest,
} from '@walletconnect/jsonrpc-utils';
import type { Wallet } from 'src/shared/types/Wallet';
import {
  isRpcRequestWithContext,
  requestWithContextToRpcRequest,
} from 'src/shared/custom-rpc';
import { normalizeChainId } from 'src/shared/normalizeChainId';
import { invariant } from 'src/shared/invariant';
import { getPortContext } from '../getPortContext';
import { HttpConnection } from '../HttpConnection';
import type { PortMessageHandler } from '../PortRegistry';

export function createHttpConnectionMessageHandler(
  getWallet: () => Wallet
): PortMessageHandler {
  return function httpConnectionMessageHandler(port, msg) {
    const context = getPortContext(port);
    if (port.name === `${browser.runtime.id}/ethereum`) {
      if (
        isJsonRpcPayload(msg) &&
        isJsonRpcRequest(msg) &&
        Boolean(msg.method)
      ) {
        const wallet = getWallet();
        wallet.publicEthereumController
          .eth_chainId({ context, id: msg.id })
          .then((chainIdStr) => {
            const chainId = normalizeChainId(chainIdStr);
            return wallet.getRpcUrlByChainId({ chainId, type: 'public' });
          })
          .then((url) => {
            invariant(url, `HttpConnection: No RpcUrl for ${context.origin}`);
            const httpConnection = new HttpConnection({ url });
            return httpConnection.send(msg);
          })
          .then((result) => {
            port.postMessage(result);
          });
        return true;
      }
    } else if (port.name === `${browser.runtime.id}/http-connection-ui`) {
      if (isRpcRequestWithContext(msg)) {
        const {
          params: { context: requestContext },
        } = msg;
        const request = requestWithContextToRpcRequest(msg);
        const chainId = normalizeChainId(requestContext.chainId);
        const wallet = getWallet();
        wallet
          .getRpcUrlByChainId({ chainId, type: 'public' })
          .then((url) => {
            invariant(url, `HttpConnection: No RpcUrl for ${context.origin}`);
            const httpConnection = new HttpConnection({ url });
            return httpConnection.send(request);
          })
          .catch((error) => formatJsonRpcError(request.id, error.message))
          .then((result) => {
            port.postMessage(result);
          });
        return true;
      }
    } else {
      return;
    }
  };
}
