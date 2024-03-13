import type browser from 'webextension-polyfill';
import type { ChannelContext } from 'src/shared/types/ChannelContext';
import type { RuntimePort } from '../webapis/RuntimePort';

function isChromePortSender(
  x: browser.Runtime.Port['sender'] | chrome.runtime.Port['sender']
): x is chrome.runtime.Port['sender'] {
  return x ? 'origin' in x : false;
}

function getPortOrigin(port: RuntimePort) {
  if (isChromePortSender(port.sender)) {
    return port.sender?.origin;
  } else if (port.sender?.url) {
    const url = new URL(port.sender.url);
    return url.origin;
  }
}

export function getPortContext(port: RuntimePort, msg: null | unknown): Partial<ChannelContext> {
  return {
    origin: getPortOrigin(port),
    tabId: port.sender?.tab?.id,
  };
}
