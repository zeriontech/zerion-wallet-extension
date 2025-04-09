import browser from 'webextension-polyfill';

export const INTERNAL_ORIGIN = new URL(browser.runtime.getURL('')).origin;
export const INTERNAL_ORIGIN_SYMBOL = Symbol();
