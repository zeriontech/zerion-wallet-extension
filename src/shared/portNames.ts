import browser from 'webextension-polyfill';

/**
 * Names of the runtime ports between extension contexts and the service
 * worker. Both ends of a port must use the same name, and the service worker
 * decides by name what a port may reach, so a name must never be typed out
 * anywhere else.
 */
export const PORT_NAMES = {
  /** Extension pages → the `Wallet` controller */
  wallet: `${browser.runtime.id}/wallet`,
  /** Content scripts of web pages → the dapp-facing controller. The only port a non-extension sender may open. */
  ethereum: `${browser.runtime.id}/ethereum`,
  httpConnectionUi: `${browser.runtime.id}/http-connection-ui`,
  accountPublicRPC: 'accountPublicRPC',
  dnaService: 'dnaService',
  sessionCacheService: 'sessionCacheService',
  window: 'window',
  handshake: 'handshake',
  contentScriptKeepAlive: 'content-script/keepAlive',
} as const;
