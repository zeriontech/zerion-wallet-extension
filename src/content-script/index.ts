import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import {
  isJsonRpcPayload,
  isJsonRpcRequest,
  isJsonRpcResponse,
} from '@walletconnect/jsonrpc-utils';
import { BackgroundScriptUpdateHandler } from 'src/shared/core/BackgroundScriptUpdateHandler';
import { PortMessageChannel } from 'src/shared/PortMessageChannel';
import { initializeInDappNotifications } from './in-dapp-notifications';

const id = nanoid();

const broadcastChannel = new BroadcastChannel(id);

const port = new PortMessageChannel({
  name: `${browser.runtime.id}/ethereum`,
});
port.initialize();

function messageHandler(msg: unknown) {
  if (isJsonRpcPayload(msg) && isJsonRpcResponse(msg)) {
    broadcastChannel.postMessage(msg);
  } else if (
    msg != null &&
    typeof msg === 'object' &&
    ((msg as { type?: string }).type === 'ethereumEvent' ||
      (msg as { type?: string }).type === 'walletEvent')
  ) {
    broadcastChannel.postMessage(msg);
  } else {
    console.log('ignored message'); // eslint-disable-line no-console
  }
}

port.emitter.on('message', messageHandler);

new BackgroundScriptUpdateHandler({
  portName: 'content-script/keepAlive',
  performHandshake: false,
  onActivate: () => {
    // content-scripts may hear this event when the background service worker
    // is re-activated, meaning we need to establish new port connections
    port.initialize();
  },
}).keepAlive();

broadcastChannel.addEventListener('message', async (event) => {
  const { data } = event;
  if (isJsonRpcRequest(data)) {
    try {
      await port.request(data.method, data.params, data.id);
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

initializeInDappNotifications();

// Insert script with id for provider _after_ creating a BroadcastChannel
const script = document.createElement('script');
script.setAttribute('id', 'zerion-extension-channel');
script.dataset.walletChannelId = id;
script.dataset.walletExtension = 'true';
const container = document.head || document.documentElement;
container.appendChild(script);
