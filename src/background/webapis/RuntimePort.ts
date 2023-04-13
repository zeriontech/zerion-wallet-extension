import type browser from 'webextension-polyfill';

export type RuntimePort = browser.Runtime.Port | chrome.runtime.Port;
