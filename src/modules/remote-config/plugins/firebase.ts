import type { ConfigPlugin } from '../ConfigPlugin';
import { promises, resolvers } from '../pluginSystem';
import type { RemoteConfig } from '../types';

const REMOTE_CONFIG_API_URL = 'https://proxy.zerion.io';

const defaultConfig: RemoteConfig = {
  user_can_create_initial_wallet: false,
  extension_wallet_name_flags: {},
};

const knownKeys = [
  'user_can_create_initial_wallet',
  'extension_wallet_name_flags',
];

async function fetchRemoteConfig(): Promise<RemoteConfig | undefined> {
  const url = new URL('/remote-config', REMOTE_CONFIG_API_URL);
  for (const key of knownKeys) {
    url.searchParams.append('key', key);
  }
  const response = await fetch(url);
  return (await response.json()) as unknown as RemoteConfig;
}

let remoteConfig: RemoteConfig | undefined;

export const firebase: ConfigPlugin = {
  onRegister() {
    promises.firebaseRemoteConfig = new Promise<void>((resolve) => {
      resolvers.firebaseRemoteConfig = resolve;
    });
  },

  initialize() {
    fetchRemoteConfig().then((config) => {
      remoteConfig = config;
      resolvers.firebaseRemoteConfig();
    });
  },

  get(key: keyof RemoteConfig) {
    const config = remoteConfig ?? defaultConfig;
    const value = config[key];
    return { value };
  },
};
