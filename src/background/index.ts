import { ethers } from 'ethers';
import {
  formatJsonRpcError,
  formatJsonRpcResult,
  isJsonRpcError,
  isJsonRpcRequest,
  isJsonRpcResult,
  JsonRpcResponse,
} from '@json-rpc-tools/utils';
import { notificationWindow } from './NotificationWindow/NotificationWindow';
import { Wallet } from './Wallet/Wallet';
import { walletStore } from './Wallet/persistence';
import { AccountPublicRPC } from './account/Account';
import { accountPublicRPC, getCurrentWallet } from './initialize';
import { HttpConnection } from './messaging/HttpConnection';

Object.assign(window, { ethers });

console.log('background.js (3)', ethers); // eslint-disable-line no-console

// const wallet = new Wallet('todo-remove', walletStore);

const ports: chrome.runtime.Port[] = [];

function pushUnique<T>(arr: T[], item: T) {
  if (!arr.includes(item)) {
    arr.push(item);
  }
}

function remove<T>(arr: T[], item: T) {
  const pos = arr.indexOf(item);
  if (pos !== -1) {
    arr.splice(pos, 1);
  }
}

const ALCHEMY_KEY = 'GQBOYG3d8DdUV4cA2LkjU5f8MCZPfQUh';
const nodeUrl = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`;
const httpConnection = new HttpConnection(nodeUrl);

walletStore.on('change', () => {
  const wallet = getCurrentWallet();
  if (!wallet) {
    return;
  }
  ports
    .filter((port) => port.name === `${chrome.runtime.id}/ethereum`)
    .forEach(async (port) => {
      const accounts = await wallet.eth_accounts({
        context: { origin: port.sender?.origin, tabId: port.sender?.tab?.id },
      });
      if (accounts.length) {
        port.postMessage({
          type: 'ethereumEvent',
          event: 'accountsChanged',
          value: accounts,
        });
      }
    });
});

Object.assign(window, {
  sendEthereumEvent: (name: string, value: unknown) => {
    ports
      .filter((port) => port.name === `${chrome.runtime.id}/ethereum`)
      .forEach(async (port) => {
        port.postMessage({
          type: 'ethereumEvent',
          event: name,
          value: value,
        });
      });
  },
});

httpConnection.on('payload', (data) => {
  console.log('httpConnection payload', data);
  ports.forEach((port) => {
    port.postMessage(data);
  });
});

// const accountPublicRPC = new AccountPublicRPC();

const objectPorts = {
  accountPublicRPC,
};

chrome.runtime.onConnect.addListener((port) => {
  console.log('background.js: port connected', port); // eslint-disable-line no-console
  if (ports.includes(port)) {
    return;
  }
  pushUnique(ports, port);
  // ports.push(port);
  port.onDisconnect.addListener(() => {
    console.log('port disconnected', port.name); // eslint-disable-line no-console
    remove(ports, port);
  });
  const context = {
    origin: port.sender?.origin,
    tabId: port.sender?.tab?.id,
  };
  const name =
    port.name in objectPorts ? (port.name as keyof typeof objectPorts) : null;
  if (name || port.name === 'wallet') {
    let controller: Wallet | AccountPublicRPC;
    if (port.name === 'wallet') {
      const wallet = getCurrentWallet();
      if (!wallet) {
        throw new Error('Wallet is not created');
      }
      controller = wallet;
    } else if (name) {
      controller = objectPorts[name];
    }
    port.onMessage.addListener(async (msg) => {
      if (isJsonRpcRequest(msg)) {
        const { method, params, id } = msg;
        console.log({ method, params, id }); // eslint-disable-line no-console
        if (method in controller === false) {
          throw new Error(`Unsupported method: ${method}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (controller[method as keyof typeof controller] as any)({
          params,
          context,
        })
          .then(
            (result: unknown) => {
              return formatJsonRpcResult(id, result);
            },
            (error: Error) => {
              return formatJsonRpcError(id, error.message);
            }
          )
          .then((result: JsonRpcResponse) => {
            console.log('controller result', result);
            port.postMessage(result);
          });
      }
    });
  } else if (port.name === 'window') {
    port.onMessage.addListener((msg) => {
      if (isJsonRpcResult(msg)) {
        notificationWindow.emit('resolve', msg);
      } else if (isJsonRpcError(msg)) {
        notificationWindow.emit('reject', msg);
      }
    });
  } else {
    port.onMessage.addListener((msg) => {
      if (isJsonRpcRequest(msg)) {
        httpConnection.send(msg, context);
      } else {
        console.log('background: not a JsonRpcRequest'); // eslint-disable-line no-console
      }
    });
  }
});

console.log('will setInterval');
setInterval(() => {
  // eslint-disable-next-line no-console
  console.log('background.js heartbeat', new Date());
}, 1000 * 60);
