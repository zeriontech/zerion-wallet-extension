import browser from 'webextension-polyfill';
import {
  formatJsonRpcError,
  isJsonRpcPayload,
  isJsonRpcRequest,
} from '@json-rpc-tools/utils';
import type { Wallet } from 'src/shared/types/Wallet';
import {
  isRpcRequestWithContext,
  requestWithContextToRpcRequest,
} from 'src/shared/custom-rpc';
import { getPortContext } from '../getPortContext';
import { HttpConnection } from '../HttpConnection';
import type { PortMessageHandler } from '../PortRegistry';

export function createHttpConnectionMessageHandler(
  getWallet: () => Wallet
  // httpConnection: HttpConnection
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
          .eth_chainId({
            context,
          })
          .then((chainId) => {
            const httpConnection = new HttpConnection({ chainId });
            return httpConnection.send(msg, context);
          })
          .then((result) => {
            port.postMessage(result);
          });
        return true;
      }
    } else if (port.name === `${browser.runtime.id}/http-connection-ui`) {
      console.log('http-connection-ui', msg);
      if (isRpcRequestWithContext(msg)) {
        const {
          params: { context: requestContext },
        } = msg;
        const request = requestWithContextToRpcRequest(msg);
        const httpConnection = new HttpConnection({
          chainId: requestContext.chainId,
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
    // if (port.name !== `${browser.runtime.id}/ethereum`) {
    //   return;
    // }
    // const context = getPortContext(port);
    // if (isJsonRpcPayload(msg) && isJsonRpcRequest(msg) && Boolean(msg.method)) {
    //   httpConnection.send(msg, context).then((result) => {
    //     port.postMessage(result);
    //   });
    //   return true;
    // }
  };
}
