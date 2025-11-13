import throttle from 'lodash/throttle';
import ky from 'ky';
import { PROXY_URL } from 'src/env/config';
import type { ConfigPlugin } from '../ConfigPlugin';
import { registerPromise, resolvers } from '../pluginSystem';
import type { RemoteConfig } from '../types';

const defaultConfig: RemoteConfig = {
  extension_wallet_name_flags: {},
  extension_uninstall_link: '',
  extension_loyalty_enabled: true,
  extension_asset_page_enabled: true,
  loyalty_config: {},
  zerion_fee_learn_more_link: '',
  fee_comparison_config: [],
  premium_page_feedback_link: '',
  quotes_refetch_interval: 20000,
};

const knownKeys: (keyof RemoteConfig)[] = [
  'extension_wallet_name_flags',
  'extension_uninstall_link',
  'extension_loyalty_enabled',
  'extension_asset_page_enabled',
  'loyalty_config',
  'fee_comparison_config',
  'premium_page_feedback_link',
  'quotes_refetch_interval',
];

export async function fetchRemoteConfig<T extends keyof RemoteConfig>(
  keys: T[]
) {
  const params = new URLSearchParams(keys.map((key) => ['key', key]));
  return ky
    .get(new URL(`remote-config?${params.toString()}`, PROXY_URL), {
      timeout: 30000,
      retry: 2,
    })
    .json<Pick<RemoteConfig, T>>();
}

let remoteConfig: RemoteConfig | undefined;

function isEmptyConfig(maybeConfig: Partial<RemoteConfig>) {
  if (!maybeConfig) {
    return true;
  }
  for (const knownKey of knownKeys) {
    if (knownKey in maybeConfig) {
      return false;
    }
  }
  return true;
}

const REFRESH_RATE = 1000 * 60 * 5;

export const firebase: ConfigPlugin & { refresh(): void } = {
  onRegister() {
    const promise = new Promise<void>((resolve) => {
      resolvers.firebaseRemoteConfig = resolve;
    });
    registerPromise('firebaseRemoteConfig', promise);
  },

  initialize() {
    fetchRemoteConfig(knownKeys).then((config) => {
      remoteConfig = config;
      resolvers.firebaseRemoteConfig();
    });
  },

  refresh: throttle(() => firebase.initialize(), REFRESH_RATE, {
    leading: false,
  }),

  get(key: keyof RemoteConfig) {
    /**
     * As a side effect of this getter, we refetch the config value.
     * The refresh() method is designed to be make actual fetch
     * no more than once every {REFRESH_RATE}, so it's ok to call it every time inside this getter
     * By doing this, we make the remoteConfig "eventually up-to-date"
     */
    firebase.refresh();
    const config =
      remoteConfig && !isEmptyConfig(remoteConfig)
        ? remoteConfig
        : defaultConfig;
    const value = config[key];
    return { value };
  },
};
