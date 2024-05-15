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
          .then((chainId) => {
            const httpConnection = new HttpConnection({
              chainId: normalizeChainId(chainId),
            });
            return httpConnection.send(msg, context);
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
        const httpConnection = new HttpConnection({
          chainId: normalizeChainId(requestContext.chainId),
        });
        httpConnection
          .send(request, context)
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
