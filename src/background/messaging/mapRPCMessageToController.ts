import type browser from 'webextension-polyfill';
import type {
  ErrorResponse,
  JsonRpcPayload,
  JsonRpcResponse,
} from '@walletconnect/jsonrpc-utils';
import {
  isJsonRpcPayload,
  isJsonRpcRequest,
} from '@walletconnect/jsonrpc-utils';
import { formatJsonRpcResultForPort } from 'src/shared/formatJsonRpcResultForPort';
import { formatJsonRpcWalletError } from 'src/shared/formatJsonRpcWalletError';
import { isClassProperty } from 'src/shared/core/isClassProperty';
import { domExceptionToError, MethodNotFound } from 'src/shared/errors/errors';
import { getError } from 'src/shared/errors/getError';
import { SLOW_MODE } from 'src/env/config';
import { wait } from 'src/shared/wait';
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
    // console.debug({ method, params, id, port, context });
    // console.table({ initiator: port.sender?.url, method, id });
    if (
      !isClassProperty(controller, method) ||
      typeof controller[method as keyof typeof controller] !== 'function'
    ) {
      port.postMessage(
        formatJsonRpcWalletError(
          id,
          new MethodNotFound(method ? `Method not found: ${method}` : undefined)
        )
      );
      return;
    }
    const controllerMethod = controller[method as keyof typeof controller];
    controllerMethod
      // @ts-ignore
      .call(controller, { params, context, id })
      // "slow mode" or "slow network" simulation, useful for debugging UI
      // .then((result) => new Promise((r) => setTimeout(() => r(result), 1000)))
      .then((result: unknown) => (SLOW_MODE ? wait(1000, result) : result))
      .then(
        (result: unknown) => {
          return formatJsonRpcResultForPort(id, result);
        },
        (error: Error | DOMException | ErrorResponse) => {
          return formatJsonRpcWalletError(
            id,
            error instanceof DOMException
              ? domExceptionToError(error).message
              : 'code' in error
              ? error
              : getError(error)
          );
        }
      )
      .then((result: JsonRpcResponse) => {
        // logging
        // console.debug('controller result', result);
        // console.table({ initiator: port.sender?.url, id: result.id });
        port.postMessage(result);
      });
  }
}
