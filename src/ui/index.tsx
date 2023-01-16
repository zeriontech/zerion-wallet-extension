import React from 'react';
import browser from 'webextension-polyfill';
import { createRoot, Root } from 'react-dom/client';
import { configureUIClient } from 'src/modules/defi-sdk';
import { BackgroundScriptUpdateHandler } from 'src/shared/core/BackgroundScriptUpdateHandler';
import { applyDrawFix } from './shared/applyDrawFix';
import { App } from './App';
import { initialize as initializeChannels } from './shared/channels';
import { queryClient } from './shared/requests/queryClient';

applyDrawFix();

async function registerServiceWorker() {
  /** Seems to be recommended when clients always expect a service worker */
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    return registration.update();
  } else {
    const { background } = browser.runtime.getManifest();
    if (background && 'service_worker' in background) {
      await navigator.serviceWorker.register(background.service_worker);
    }
  }
}

async function handleFailedHandshake() {
  const registration = await navigator.serviceWorker.getRegistration();
  await registration?.unregister();
  window.location.reload(); // MUST reload to be able to register new service worker
}

let reactRoot: Root | null = null;

function initializeUI() {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('#root element not found');
  }
  registerServiceWorker()
    .then(() => initializeChannels())
    .then(() => queryClient.clear())
    .then(() => configureUIClient())
    .then(() => {
      if (reactRoot) {
        reactRoot.unmount();
      }
      reactRoot = createRoot(root);
      reactRoot.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    });
}

initializeUI();

new BackgroundScriptUpdateHandler({
  onActivate: () => initializeUI(),
  onFailedHandshake: () => handleFailedHandshake(),
}).keepAlive();
