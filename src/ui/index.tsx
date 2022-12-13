import React from 'react';
import { createRoot } from 'react-dom/client';
import { configureUIClient } from 'src/modules/defi-sdk';
import { applyDrawFix } from './shared/applyDrawFix';
import { App } from './App';

applyDrawFix();

const root = document.getElementById('root');
if (!root) {
  throw new Error('#root element not found');
}

async function registerServiceWorker() {
  /** Seems to be recommended when clients always expect a service worker */
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.update();
}

registerServiceWorker()
  .then(() => configureUIClient())
  .then(() => {
    createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
