import browser from 'webextension-polyfill';
import { ethers } from 'ethers';
import { mainNetworksStore } from 'src/modules/networks/networks-store.background';
import { configureBackgroundClient } from 'src/modules/defi-sdk/background';
import { SessionCacheService } from 'src/background/resource/sessionCacheService';
import { openOnboarding } from 'src/shared/openOnboarding';
import { userLifecycleStore } from 'src/shared/analytics/shared/UserLifecycle';
import { UrlContextParam } from 'src/shared/types/UrlContext';
import { initialize } from './initialize';
import { PortRegistry } from './messaging/PortRegistry';
import { createWalletMessageHandler } from './messaging/port-message-handlers/createWalletMessageHandler';
import { createPortMessageHandler } from './messaging/port-message-handlers/createPortMessageHandler';
import { createNotificationWindowMessageHandler } from './messaging/port-message-handlers/notificationWindowMessageHandler';
import { createHttpConnectionMessageHandler } from './messaging/port-message-handlers/createHTTPConnectionMessageHandler';
import { handleAccountEvents } from './messaging/controller-event-handlers/account-events-handler';
import { EthereumEventsBroadcaster } from './messaging/controller-event-handlers/ethereum-provider-events';
import { MemoryCacheRPC } from './resource/memoryCacheRPC';
import type { RuntimePort } from './webapis/RuntimePort';
import { emitter } from './events';
import * as userActivity from './user-activity';
import { ContentScriptManager } from './ContentScriptManager';
import { TransactionService } from './transactions/TransactionService';
import { Account } from './account/Account';
import { INTERNAL_SYMBOL_CONTEXT } from './Wallet/Wallet';

Object.assign(globalThis, { ethers });

globalThis.addEventListener('install', (_event) => {
  /** Seems to be recommended when clients always expect a service worker */
  // @ts-ignore sw service-worker environment
  globalThis.skipWaiting();
});
globalThis.addEventListener('activate', (_event) => {
  /** Seems to be recommended when clients always expect a service worker */
  // @ts-ignore sw service-worker environment
  globalThis.clients.claim();
});

if (process.env.NODE_ENV === 'development') {
  // Set different icon for development
  const icon = new URL('../images/logo-icon-dev-128.png', import.meta.url);
  browser.action.setIcon({
    path: icon.toString(),
  });
}

configureBackgroundClient();
mainNetworksStore.load();

function isOnboardingMode(port: RuntimePort) {
  if (!port.sender?.url) {
    return false;
  }
  const portSenderUrl = new URL(port.sender.url);
  return (
    portSenderUrl.searchParams.get(UrlContextParam.appMode) === 'onboarding'
  );
}

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

async function notifyContentScriptsAndUIAboutInitialization() {
  try {
    await browser.runtime.sendMessage(browser.runtime.id, {
      event: 'background-initialized',
    });
  } catch (e) {
    /* OK, message is meant only for a running UI */
  }
  // To query all tabs, pass empty object to tabs.query({})
  const tabs = await browser.tabs.query({});
  tabs.forEach(async (tab) => {
    if (!tab.id) {
      return;
    }
    try {
      await browser.tabs.sendMessage(tab.id, {
        event: 'background-initialized',
      });
    } catch (error) {
      // "Could not establish connection. Receiving end does not exist."
      // No problem, this message is only meant for content-scripts which
      // are still attached to a disconnected extension context
    }
  });
}

const portRegistry = new PortRegistry();
Object.assign(globalThis, { portRegistry });

// Listeners must be registered synchronously from the start of the page:
// https://developer.chrome.com/docs/extensions/mv3/service_workers/#listeners
browser.runtime.onConnect.addListener((port) => {
  if (verifyPort(port)) {
    portRegistry.register(port);
  } else if (port.name === 'content-script/keepAlive') {
    // This is an attempt to keep service worker alive. By sending a disconnect
    // to the connected port, we force the content script to create a new
    // connection (custom logic), which, in turn, should keep service worker running.
    const WAIT_TIME_MS = 240000; // some heuristic, maybe should be sooner
    setTimeout(() => {
      port.disconnect();
    }, WAIT_TIME_MS);
  }
});

userActivity.trackLastActive();
userActivity.scheduleAlarms();
// Listeners for alarms must also be registered at the top level.
// It's not mentioned on the Alarms API page, but it's mentioned here:
// https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/#alarms
browser.alarms.onAlarm.addListener(userActivity.handleAlarm);
browser.alarms.onAlarm.addListener(ContentScriptManager.handleAlarm);
browser.alarms.onAlarm.addListener(TransactionService.handleAlarm);

console.time('bg initialize'); // eslint-disable-line no-console
initialize().then((values) => {
  const { account, accountPublicRPC, dnaService, notificationWindow } = values;
  console.timeEnd('bg initialize'); // eslint-disable-line no-console
  notifyContentScriptsAndUIAboutInitialization();
  // const httpConnection = new HttpConnection(() => account.getCurrentWallet());
  const memoryCacheRPC = new MemoryCacheRPC();

  new ContentScriptManager().removeExpiredRecords().activate();

  portRegistry.addMessageHandler(
    createWalletMessageHandler(() => account.getCurrentWallet())
  );
  portRegistry.addMessageHandler((port, msg) => {
    if (port.name === 'handshake') {
      port.postMessage({ ack: (msg as { syn: number }).syn + 1 });
    }
  });
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
  portRegistry.addMessageHandler(
    createPortMessageHandler({
      check: (port) => port.name === 'dnaService',
      controller: dnaService,
    })
  );
  portRegistry.addMessageHandler(
    createPortMessageHandler({
      check: (port) => port.name === 'sessionCacheService',
      controller: new SessionCacheService(),
    })
  );
  portRegistry.addMessageHandler(
    createNotificationWindowMessageHandler(notificationWindow)
  );
  portRegistry.addMessageHandler(
    // createHttpConnectionMessageHandler(httpConnection)
    createHttpConnectionMessageHandler(() => account.getCurrentWallet())
  );

  handleAccountEvents({ account });
  const ethereumEventsBroadcaster = new EthereumEventsBroadcaster({
    account,
    getActivePorts: () => portRegistry.getActivePorts(),
  });
  ethereumEventsBroadcaster.startListening();

  portRegistry.addListener('disconnect', (port: RuntimePort) => {
    if (
      port.name === `${browser.runtime.id}/wallet` &&
      !isOnboardingMode(port)
    ) {
      // Means extension UI is closed
      account.expirePasswordSession();
    }
  });

  account.on('reset', () => {
    portRegistry.postMessage({
      portName: `${browser.runtime.id}/wallet`,
      message: { payload: 'session-logout' },
    });
  });

  emitter.on('sessionExpired', () => account.logout());

  if (process.env.NODE_ENV === 'test') {
    const wallet = account.getCurrentWallet();
    const password = 'testtest';
    const user = Account.createUser(password);
    account.setUser(user, { password }, { isNewUser: true }).then(() => {
      wallet.uiGenerateMnemonic().then((pendingWallet) => {
        account.saveUserAndWallet().then(() => {
          wallet.setCurrentAddress({
            params: { address: pendingWallet.address },
            context: INTERNAL_SYMBOL_CONTEXT,
          });
        });
      });
    });
  }
});

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install' && process.env.NODE_ENV !== 'test') {
    userLifecycleStore.handleRuntimeInstalledEvent();
    openOnboarding();
  }
});
