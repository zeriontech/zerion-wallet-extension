import React from 'react';
import { createRoot } from 'react-dom/client';
import 'normalize.css';
import './style/global.module.css';
import './style/fonts.module.css';
import './style/theme.module.css';
import { applyDrawFix } from './shared/applyDrawFix';
import { App } from './App';
import { configureUIClient } from 'src/modules/defi-sdk';

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
