import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import {
  isJsonRpcPayload,
  isJsonRpcRequest,
  isJsonRpcResponse,
} from '@json-rpc-tools/utils';
import { BackgroundScriptUpdateHandler } from 'src/shared/core/BackgroundScriptUpdateHandler';

const id = nanoid();

const broadcastChannel = new BroadcastChannel(id);

function createPort() {
  const port = browser.runtime.connect({
    name: `${browser.runtime.id}/ethereum`,
  });

  function messageHandler(msg: unknown) {
    if (isJsonRpcPayload(msg) && isJsonRpcResponse(msg)) {
      broadcastChannel.postMessage(msg);
    } else if (
      msg != null &&
      typeof msg === 'object' &&
      (msg as { type?: string }).type === 'ethereumEvent'
    ) {
      broadcastChannel.postMessage(msg);
    } else {
      console.log('ignored message'); // eslint-disable-line no-console
    }
  }
  port.onMessage.addListener(messageHandler);

  function disconnectHandler(port: browser.Runtime.Port) {
    port.onMessage.removeListener(messageHandler);
    port.onDisconnect.removeListener(disconnectHandler);
  }
  port.onDisconnect.addListener(disconnectHandler);
  return port;
}

let port = createPort();

new BackgroundScriptUpdateHandler({
  portName: 'content-script/keepAlive',
  performHandshake: false,
  onActivate: () => {
    // content-scripts may hear this event when the background service worker
    // is re-activated, meaning we need to establish new port connections
    port = createPort();
  },
}).keepAlive();

broadcastChannel.addEventListener('message', (event) => {
  const { data } = event;
  if (isJsonRpcRequest(data)) {
    try {
      port.postMessage(data);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Extension context invalidated.'
      ) {
        /**
         * It might be possible to re-execute this content-script after extension
         * has been invalidated (e.g. reinstalled), see:
         *
         * Explanation: https://stackoverflow.com/a/11598753/3523645
         * Code example: https://stackoverflow.com/a/55336841/3523645
         *
         * But because we're modifying the DOM (injecting window.ethereum global),
         * dapps might still reference the old object. I am not sure this is a problem,
         * because the BroadcastChannel should still work, but I did not test this :)
         * So for now, I'm just refreshing the page to access the updated browser.runtime
         */
        window.location.reload();
      } else {
        throw error;
      }
    }
  } else {
    console.log('not a JsonRpcRequest'); // eslint-disable-line no-console
  }
});

// Insert script with id for provider _after_ creating a BroadcastChannel
const script = document.createElement('script');
script.setAttribute('id', 'zerion-extension-channel');
script.dataset.walletChannelId = id;
script.dataset.walletExtension = 'true';
const container = document.head || document.documentElement;
container.appendChild(script);
