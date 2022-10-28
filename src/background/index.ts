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
import { MemoryCacheRPC } from './resource/memoryCacheRPC';
import { networksStore } from 'src/modules/networks/networks-store';
import { configureBackgroundClient } from 'src/modules/defi-sdk';
import { start as startIdleTimer } from './idle-time-handler';

Object.assign(window, { ethers });

configureBackgroundClient();
networksStore.load();

initialize().then(({ account, accountPublicRPC }) => {
  const httpConnection = new HttpConnection(() => account.getCurrentWallet());
  const memoryCacheRPC = new MemoryCacheRPC();

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
  portRegistry.addMessageHandler(
    createPortMessageHandler({
      check: (port) => port.name === 'memoryCacheRPC',
      controller: memoryCacheRPC,
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
    portRegistry.register(port);
  });

  account.on('reset', () => {
    portRegistry.postMessage({
      portName: `${chrome.runtime.id}/wallet`,
      message: 'session-logout',
    });
  });

  startIdleTimer(() => {
    account.logout();
  });
});
