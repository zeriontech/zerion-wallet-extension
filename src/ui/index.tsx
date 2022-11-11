import React from 'react';
import { createRoot } from 'react-dom/client';
import { configureUIClient } from 'src/modules/defi-sdk';
import { applyDrawFix } from './shared/applyDrawFix';
import { App } from './App';

applyDrawFix();
configureUIClient();

const root = document.getElementById('root');
if (!root) {
  throw new Error('#root element not found');
}
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
