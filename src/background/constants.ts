import browser from 'webextension-polyfill';

export const INTERNAL_ORIGIN = new URL(browser.runtime.getURL('')).origin;
export const INTERNAL_ORIGIN_SYMBOL = Symbol();
/** Wallet method context for calls made by the background itself */
export const INTERNAL_SYMBOL_CONTEXT = { origin: INTERNAL_ORIGIN_SYMBOL };
