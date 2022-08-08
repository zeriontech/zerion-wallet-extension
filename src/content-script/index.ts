import { nanoid } from 'nanoid';
import { isJsonRpcRequest, isJsonRpcResponse } from '@json-rpc-tools/utils';
// @ts-ignore parcel syntax for inlining: https://parceljs.org/features/bundle-inlining/#inlining-a-bundle-as-text
import inPageContent from 'bundle-text:./in-page';

const script = document.createElement('script');

const id = nanoid();
let content = `window.myWalletChannelId = "${id}";;`;
content += inPageContent;
script.textContent = content;
script.dataset.walletExtension = 'true';

const container = document.head || document.documentElement;
container.appendChild(script);

const broadcastChannel = new BroadcastChannel(id);

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
