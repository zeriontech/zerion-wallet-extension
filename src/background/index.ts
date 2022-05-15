require('./bufferPolyfill');
import { ethers } from 'ethers';
import { initialize } from './initialize';
import { HttpConnection } from './messaging/HttpConnection';
import { PortRegistry } from './messaging/PortRegistry';
import { createWalletMessageHandler } from './messaging/port-message-handlers/createWalletMessageHandler';
import { createPortMessageHandler } from './messaging/port-message-handlers/createPortMessageHandler';
import { createNotificationWindowMessageHandler } from './messaging/port-message-handlers/notificationWindowMessageHandler';
import { createHttpConnectionMessageHandler } from './messaging/port-message-handlers/createHTTPConnectionMessageHandler';
import { handleAccountEvents } from './messaging/controller-event-handlers/account-events-handler';
import { EthereumEventsBroadcaster } from './messaging/controller-event-handlers/ethereum-provider-events';

Object.assign(window, { ethers });

console.log('background.js (3)', ethers); // eslint-disable-line no-console

initialize().then(({ account, accountPublicRPC }) => {
  const ALCHEMY_KEY = 'GQBOYG3d8DdUV4cA2LkjU5f8MCZPfQUh';
  const nodeUrl = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`;

  const httpConnection = new HttpConnection(nodeUrl, account);

  const portRegistry = new PortRegistry();
  portRegistry.addMessageHandler(
    createWalletMessageHandler(() => account.getCurrentWallet())
  );
  portRegistry.addMessageHandler(
    createPortMessageHandler({
      check: (port) => port.name === 'accountPublicRPC',
      controller: accountPublicRPC,
    })
  );
  portRegistry.addMessageHandler(createNotificationWindowMessageHandler());
  portRegistry.addMessageHandler(
    createHttpConnectionMessageHandler(httpConnection)
  );

  handleAccountEvents({ account });
  const ethereumEventsBroadcaster = new EthereumEventsBroadcaster({
    account,
    getActivePorts: () => portRegistry.getActivePorts(),
  });
  ethereumEventsBroadcaster.startListening();

  chrome.runtime.onConnect.addListener((port) => {
    console.log('background.js: port connected', port); // eslint-disable-line no-console
    portRegistry.register(port);
  });

  console.log('will setInterval');
  setInterval(() => {
    // eslint-disable-next-line no-console
    console.log('background.js heartbeat', new Date());
  }, 1000 * 60);
});
