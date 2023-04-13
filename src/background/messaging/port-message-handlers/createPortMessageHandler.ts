import type browser from 'webextension-polyfill';
import type { PortMessageHandler } from '../PortRegistry';
import { mapRPCMessageToController } from '../mapRPCMessageToController';
import { getPortContext } from '../getPortContext';

export function createPortMessageHandler<T>({
  controller,
  check,
}: {
  controller: T;
  check: (port: chrome.runtime.Port | browser.Runtime.Port) => boolean;
}): PortMessageHandler {
  return function portMessageHandler(port, msg) {
    if (!check(port)) {
      return;
    }
    const context = getPortContext(port);
    mapRPCMessageToController(port, msg, controller, context);
    return true;
  };
}
