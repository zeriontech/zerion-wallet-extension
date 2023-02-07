import browser from 'webextension-polyfill';
import { Loglevel, logTable } from 'src/shared/logger';
import { version } from 'src/shared/packageVersion';

type MetabaseEvent =
  | 'screen_view'
  | 'dapp_connection'
  | 'signed_message'
  | 'signed_transaction'
  | 'client_error'
  | 'daylight_action';

type BaseParams<E = MetabaseEvent> = { request_name: E };

function onIdle(callback: () => void) {
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
  logTable(Loglevel.info, params);
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

export function createParams<T extends BaseParams>(data: T) {
  return {
    platform: os,
    api_client_name: 'Zerion Extension',
    origin: globalThis.location.origin,
    timestamp: new Date().toISOString(),
    wallet_provider: 'Zerion Wallet',
    app_version: version,
    ...data,
  };
}
