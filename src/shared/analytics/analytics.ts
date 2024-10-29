import browser from 'webextension-polyfill';
import { Loglevel, logTable, logToConsole } from 'src/shared/logger';
import { version } from 'src/shared/packageVersion';
import { detectBrowser } from 'src/modules/detect-browser/detect-browser';

type MetabaseEvent =
  | 'screen_view'
  | 'dapp_connection'
  | 'signed_message'
  | 'signed_transaction'
  | 'client_error'
  | 'error_registering_dna_action'
  | 'daylight_action'
  | 'custom_evm_network_created'
  | 'network_search'
  | 'error_screen_view'
  | 'error_screen_view'
  | 'metamask_mode'
  | 'loader_screen_view'
  | 'eip_6963_support'
  | 'add_wallet'
  | 'hold_to_sign_prerefence';

type BaseParams<E = MetabaseEvent> = { request_name: E };

export function onIdle(callback: () => void) {
  if ('requestIdleCallback' in globalThis) {
    globalThis.requestIdleCallback(callback);
  } else {
    setTimeout(callback);
  }
}

export function sendToMetabase<
  E extends MetabaseEvent,
  T extends BaseParams<E>
>(event: E, params: T) {
  logToConsole(Loglevel.info, 'group', `Metabase: ${params.request_name}`);
  logTable(Loglevel.info, params);
  logToConsole(Loglevel.info, 'groupEnd');
  if (process.env.NODE_ENV !== 'development') {
    onIdle(() => {
      fetch(`https://event-collector.zerion.io/${event}/`, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'content-type': 'application/json' },
      });
    });
  }
}

let os: browser.Runtime.PlatformOs | null = null;
async function readOs() {
  const info = await browser.runtime.getPlatformInfo();
  os = info.os;
}
readOs();

const detectedBrowser = detectBrowser(globalThis.navigator.userAgent);
const browserInfo = [detectedBrowser.browser, detectedBrowser.version].join(
  ' '
);

export function createParams<T extends BaseParams>(data: T) {
  return {
    platform: os,
    // we use os_version for compatibility with mobile platforms
    os_version: browserInfo,
    browser_info: globalThis.navigator.userAgent,
    api_client_name: 'Zerion Extension',
    origin: globalThis.location.origin,
    timestamp: new Date().toISOString(),
    wallet_provider: 'Zerion Wallet',
    app_version: version,
    ...data,
  };
}
