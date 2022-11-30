import browser from 'webextension-polyfill';
import { ethers } from 'ethers';
import { networksStore } from 'src/modules/networks/networks-store';
import { configureBackgroundClient } from 'src/modules/defi-sdk/background';
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
import { start as startIdleTimer } from './idle-time-handler';
import type { RuntimePort } from './webapis/RuntimePort';

Object.assign(globalThis, { ethers });

configureBackgroundClient();
networksStore.load();

function verifyPort(port: RuntimePort) {
  const protocol = port.sender?.url ? new URL(port.sender.url).protocol : null;
  if (protocol === 'chrome-extension:') {
    return true;
  } else {
    // the only non-extension (meaning, content-script) port
    // allowed is `${browser.runtime.id}/ethereum`
    return port.name === `${browser.runtime.id}/ethereum`;
  }
}

function notifyContentScriptsAndUIAboutInitialization() {
  // To query all tabs, pass empty object to tabs.query({})
  browser.tabs.query({}).then((tabs) => {
    tabs.forEach(async (tab) => {
      if (!tab.id) {
        return;
      }
      try {
        await chrome.tabs.sendMessage(tab.id, {
          event: 'background-initialized',
        });
      } catch (error) {
        // "Could not establish connection. Receiving end does not exist."
        // No problem, this message is only meant for content-scripts which
        // are still attached to a disconnected extension context
      }
    });
  });
}

initialize().then(({ account, accountPublicRPC }) => {
  notifyContentScriptsAndUIAboutInitialization();
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

  browser.runtime.onConnect.addListener((port) => {
    if (verifyPort(port)) {
      portRegistry.register(port);
    }
  });

  portRegistry.addListener('disconnect', (port: RuntimePort) => {
    if (port.name === `${browser.runtime.id}/wallet`) {
      // Means extension UI is closed
      account.expirePasswordSession();
    }
  });

  account.on('reset', () => {
    portRegistry.postMessage({
      portName: `${browser.runtime.id}/wallet`,
      message: 'session-logout',
    });
  });

  startIdleTimer(() => {
    account.logout();
  });
});
