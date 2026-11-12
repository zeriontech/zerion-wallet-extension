import { isJsonRpcPayload, isJsonRpcRequest } from '@walletconnect/jsonrpc-utils';
import type { Wallet } from 'src/shared/types/Wallet';
import { isClassProperty } from 'src/shared/core/isClassProperty';
import { isDappRpcMethod } from 'src/background/Wallet/dappRpcMethods';
import { PORT_NAMES } from 'src/shared/portNames';
import { mapRPCMessageToController } from '../mapRPCMessageToController';
import { getPortContext } from '../getPortContext';
import type { PortMessageHandler } from '../PortRegistry';

export function createWalletMessageHandler(getWallet: () => Wallet): PortMessageHandler {
  return function walletMessageHandler(port, msg): boolean {
    const isValidRequest = isJsonRpcPayload(msg) && isJsonRpcRequest(msg);

    if (!isValidRequest) {
      return false;
    }
    const context = getPortContext(port);
    const { method } = msg;

    function mapToControllerIfPossible<T>(controller: T) {
      if (
        isClassProperty(controller, method) &&
        typeof controller[method as keyof typeof controller] === 'function'
      ) {
        mapRPCMessageToController(port, msg, controller, context);
        return true;
      } else {
        return false;
      }
    }

    if (port.name === PORT_NAMES.ethereum) {
      // Web pages reach this port: only declared RPC methods are dispatched
      if (!isDappRpcMethod(method)) {
        return false;
      }
      mapRPCMessageToController(port, msg, getWallet().publicEthereumController, context);
      return true;
    } else if (port.name === PORT_NAMES.wallet) {
      const controller = getWallet();
      return mapToControllerIfPossible(controller);
    } else {
      return false;
    }
  };
}
