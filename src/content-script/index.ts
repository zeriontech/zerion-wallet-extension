import { isJsonRpcRequest, isJsonRpcResponse } from '@json-rpc-tools/utils';

const script = document.createElement('script');

const id = 'my-wallet-channel';
let content = `window.myWalletChannelId = "${id}";;`;
content += '#IN_PAGE_SCRIPT#';
script.textContent = content;

const container = document.head || document.documentElement;
container.appendChild(script);

const broadcastChannel = new BroadcastChannel('my-wallet-channel');

const port = chrome.runtime.connect({ name: `${chrome.runtime.id}/ethereum` });

port.onMessage.addListener((msg) => {
  if (isJsonRpcResponse(msg)) {
    broadcastChannel.postMessage(msg);
  } else if (msg.type === 'ethereumEvent') {
    broadcastChannel.postMessage(msg);
  } else {
    console.log('ignored message'); // eslint-disable-line no-console
  }
});

broadcastChannel.addEventListener('message', (event) => {
  const { data } = event;
  if (isJsonRpcRequest(data)) {
    port.postMessage(data);
  } else {
    console.log('not a JsonRpcRequest'); // eslint-disable-line no-console
  }
});
