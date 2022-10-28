import browser from 'webextension-polyfill';
import {
  ErrorResponse,
  isJsonRpcPayload,
  isJsonRpcRequest,
  JsonRpcPayload,
  JsonRpcResponse,
} from '@json-rpc-tools/utils';
import { formatJsonRpcResultForPort } from 'src/shared/formatJsonRpcResultForPort';
import { formatJsonRpcWalletError } from 'src/shared/formatJsonRpcWalletError';
import type { PortContext } from './PortContext';

/**
 * This function takes a JsonRpcRequest and maps
 * it to a corresponding method of a controller (if it exists),
 * then posts the result back to the port
 */
export function mapRPCMessageToController<T>(
  port: browser.Runtime.Port | chrome.runtime.Port,
  msg: JsonRpcPayload | unknown,
  controller: T,
  context: PortContext
) {
  if (isJsonRpcPayload(msg) && isJsonRpcRequest(msg)) {
    const { method, params, id } = msg;
    // logging
    // console.log({ method, params, id, port, context });
    if (method in controller === false) {
      throw new Error(`Unsupported method: ${method}`);
    }
    const controllerMethod = controller[method as keyof typeof controller];
    controllerMethod
      // @ts-ignore
      .call(controller, { params, context })
      .then(
        (result: unknown) => {
          return formatJsonRpcResultForPort(id, result);
        },
        (error: Error | ErrorResponse) => {
          return formatJsonRpcWalletError(
            id,
            'code' in error ? error : error.message
          );
        }
      )
      .then((result: JsonRpcResponse) => {
        // logging
        // console.log('controller result', result);
        port.postMessage(result);
      });
  }
}
