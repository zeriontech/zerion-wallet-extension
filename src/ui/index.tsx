import React from 'react';
import browser from 'webextension-polyfill';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { configureUIClient } from 'src/modules/defi-sdk';
import { BackgroundScriptUpdateHandler } from 'src/shared/core/BackgroundScriptUpdateHandler';
import { initializeClientAnalytics } from 'src/shared/analytics/analytics.client';
import { HandshakeFailed } from 'src/shared/errors/errors';
import { runtimeStore } from 'src/shared/core/runtime-store';
import { applyDrawFix } from './shared/applyDrawFix';
import { App } from './App';
import type { AppProps } from './App/App';
import { initialize as initializeChannels } from './shared/channels';
import { queryClient } from './shared/requests/queryClient';
import { emitter } from './shared/events';
import { persistQueryClient } from './shared/requests/queryClientPersistence';
import { getPreferences } from './features/preferences/usePreferences';
import { OnboardingInterrupt } from './features/onboarding/errors';
import { maybeOpenOnboarding } from './features/onboarding/initialization';

applyDrawFix();
if (process.env.NODE_ENV === 'development') {
  console.time('UI render'); // eslint-disable-line no-console
  console.time('UI render effect'); // eslint-disable-line no-console
}

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

function renderApp({ initialView, inspect }: AppProps) {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('#root element not found');
  }

  if (reactRoot) {
    reactRoot.unmount();
  }
  reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <App initialView={initialView} inspect={inspect} />
    </React.StrictMode>
  );
}

let isFirstLoad = true;
async function initializeUI({
  initialView,
  inspect,
}: Pick<AppProps, 'initialView' | 'inspect'> = {}) {
  const innerIsFirstLoad = isFirstLoad;
  isFirstLoad = false;
  try {
    await registerServiceWorker();
    initializeChannels();

    if (process.env.NODE_ENV !== 'test') {
      await maybeOpenOnboarding();
    }

    if (innerIsFirstLoad) {
      await persistQueryClient(queryClient);
    } else {
      queryClient.clear();
    }
    await getPreferences(); // seed queryClient. TODO before merge: do we need this?
    await configureUIClient();
    initializeClientAnalytics();
    renderApp({ initialView, inspect });
  } catch (error) {
    if (error instanceof OnboardingInterrupt) {
      // do nothing
    } else {
      throw error;
    }
  }
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
  initializeUI({ initialView: 'handshakeFailure' });
}

new BackgroundScriptUpdateHandler({
  onActivate: () => {
    initializeChannels();
    runtimeStore.setState({ connected: true });
  },
  onDisconnect: () => {
    runtimeStore.setState({ connected: false });
  },
  onFailedHandshake: () => handleFailedHandshake(),
}).keepAlive();

initializeUI();

// TODO: replace with window.location.reload
emitter.on('reloadExtension', initializeUI);
