import { isJsonRpcPayload, isJsonRpcRequest } from '@json-rpc-tools/utils';
import type { Wallet } from 'src/shared/types/Wallet';
import { mapRPCMessageToController } from '../mapRPCMessageToController';
import { getPortContext } from '../getPortContext';
import type { PortMessageHandler } from '../PortRegistry';

export function createWalletMessageHandler(
  getWallet: () => Wallet
): PortMessageHandler {
  return function walletMessageHandler(port, msg) {
    const canBehandledByWallet = (msg: unknown) => {
      const controller = getWallet();
      if (
        port.name === `${chrome.runtime.id}/ethereum` &&
        isJsonRpcPayload(msg) &&
        isJsonRpcRequest(msg)
      ) {
        const { method } = msg;
        return (
          method in controller &&
          typeof controller[method as keyof typeof controller] === 'function'
        );
      }
    };
    if (port.name === 'wallet' || canBehandledByWallet(msg)) {
      const controller = getWallet();
      const context = getPortContext(port);
      mapRPCMessageToController(port, msg, controller, context);
      return true;
    }
    return false;
  };
}
