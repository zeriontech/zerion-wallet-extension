import {
  ErrorResponse,
  formatJsonRpcError,
  isJsonRpcPayload,
  isJsonRpcRequest,
  JsonRpcPayload,
  JsonRpcResponse,
} from '@json-rpc-tools/utils';
import { formatJsonRpcResultForPort } from 'src/shared/formatJsonRpcResultForPort';
import type { PortContext } from './PortContext';

/**
 * This function takes a JsonRpcRequest and maps
 * it to a corresponding method of a controller (if it exists),
 * then posts the result back to the port
 */
export function mapRPCMessageToController<T>(
  port: chrome.runtime.Port,
  msg: JsonRpcPayload | unknown,
  controller: T,
  context: PortContext
) {
  if (isJsonRpcPayload(msg) && isJsonRpcRequest(msg)) {
    const { method, params, id } = msg;
    console.log({ method, params, id, port, context }); // eslint-disable-line no-console
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
          console.log({ error });
          return formatJsonRpcError(
            id,
            'code' in error ? error : error.message
          );
        }
      )
      .then((result: JsonRpcResponse) => {
        console.log('controller result', result);
        port.postMessage(result);
      });
  }
}
