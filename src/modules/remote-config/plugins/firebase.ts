import type { ConfigPlugin } from '../ConfigPlugin';
import { promises, resolvers } from '../pluginSystem';
import { RemoteConfig } from '../types';

const REMOTE_CONFIG_API_URL = 'http://localhost:8080';

const defaultConfig: RemoteConfig = {
  allow_create_wallet: false,
};

async function fetchRemoteConfig(): Promise<RemoteConfig | undefined> {
  const url = new URL('/remote-config', REMOTE_CONFIG_API_URL);
  url.searchParams.append('prefix', 'extension_');
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

  /**
   * Reads the parameter value by a given key.
   */
  get(key: keyof RemoteConfig) {
    const config = remoteConfig ?? defaultConfig;
    const value = config[key];
    return { value };
  },
};
