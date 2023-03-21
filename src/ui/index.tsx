import React from 'react';
import browser from 'webextension-polyfill';
import { createRoot, Root } from 'react-dom/client';
import { configureUIClient } from 'src/modules/defi-sdk';
import { BackgroundScriptUpdateHandler } from 'src/shared/core/BackgroundScriptUpdateHandler';
import { initializeClientAnalytics } from 'src/shared/analytics/analytics.client';
import { HandshakeFailed } from 'src/shared/errors/errors';
import { getCurrentUser } from 'src/shared/getCurrentUser';
import { applyDrawFix } from './shared/applyDrawFix';
import { App } from './App';
import { initialize as initializeChannels } from './shared/channels';
import { queryClient } from './shared/requests/queryClient';
import { emitter } from './shared/events';

applyDrawFix();

async function registerServiceWorker() {
  /** Seems to be recommended when clients always expect a service worker */
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    // We can try calling an update method here, but I'm not sure
    // it does anything useful. I'll comment it out for now as an experiment.
    // return registration.update();
  } else {
    const { background } = browser.runtime.getManifest();
    if (background && 'service_worker' in background) {
      await navigator.serviceWorker.register(background.service_worker);
    }
  }
}

let reactRoot: Root | null = null;

async function initializeUI(opts?: { handshakeFailure?: boolean }) {
  const isPopup = browser.extension.getViews({ type: 'popup' }).length > 0;
  const hasOnboardingUrl = document.location.hash.startsWith('#/onboarding');

  const root = document.getElementById('root');
  if (!root) {
    throw new Error('#root element not found');
  }
  await registerServiceWorker();
  initializeChannels();

  const currentUser = await getCurrentUser();
  const userHasWallets = Boolean(Object.keys(currentUser).length);
  if (isPopup && !userHasWallets) {
    const url = new URL('./index.html', import.meta.url);
    browser.tabs.create({
      url: url.toString(),
    });
  }

  queryClient.clear();
  return configureUIClient()
    .then(() => initializeClientAnalytics())
    .then(() => {
      if (reactRoot) {
        reactRoot.unmount();
      }
      reactRoot = createRoot(root);
      reactRoot.render(
        <React.StrictMode>
          <App
            defaultView={
              opts?.handshakeFailure ? 'handshakeFailure' : undefined
            }
            viewMode={isPopup ? 'popup' : 'window'}
            mode={
              hasOnboardingUrl || (!isPopup && !userHasWallets)
                ? 'onboarding'
                : 'wallet'
            }
          />
        </React.StrictMode>
      );
    });
}

async function handleFailedHandshake() {
  /**
   * This code (which is commented out) works in local development,
   * but also can lead to unwanted page refreshes. I'll leave it here as
   * a reference to a working method for force-updating the service_worker,
   * but maybe it's only worth to use during development.
   */
  // const registration = await navigator.serviceWorker.getRegistration();
  // await registration?.unregister();
  // window.location.reload(); // MUST reload to be able to register new service worker
  emitter.emit('error', new HandshakeFailed());
  initializeUI({ handshakeFailure: true });
}

initializeUI().then(() => {
  new BackgroundScriptUpdateHandler({
    onActivate: () => initializeUI(),
    onFailedHandshake: () => handleFailedHandshake(),
  }).keepAlive();
});
