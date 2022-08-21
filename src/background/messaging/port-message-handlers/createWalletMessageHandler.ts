import { isJsonRpcPayload, isJsonRpcRequest } from '@json-rpc-tools/utils';
import type { Wallet } from 'src/shared/types/Wallet';
import { mapRPCMessageToController } from '../mapRPCMessageToController';
import { getPortContext } from '../getPortContext';
import type { PortMessageHandler } from '../PortRegistry';

export function createWalletMessageHandler(
  getWallet: () => Wallet
): PortMessageHandler {
  return function walletMessageHandler(port, msg): boolean {
    const isValidRequest = isJsonRpcPayload(msg) && isJsonRpcRequest(msg);

    if (!isValidRequest) {
      return false;
    }
    const context = getPortContext(port);
    const { method } = msg;

    function mapToControllerIfPossible<T>(controller: T) {
      if (
        method in controller &&
        typeof controller[method as keyof typeof controller] === 'function'
      ) {
        mapRPCMessageToController(port, msg, controller, context);
        return true;
      } else {
        return false;
      }
    }

    if (port.name === `${chrome.runtime.id}/ethereum`) {
      const controller = getWallet().publicEthereumController;
      return mapToControllerIfPossible(controller);
    } else if (port.name === `${chrome.runtime.id}/wallet`) {
      const controller = getWallet();
      return mapToControllerIfPossible(controller);
    } else {
      return false;
    }
  };
}
