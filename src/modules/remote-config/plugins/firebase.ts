import { fetchRemoteConfig, FirebaseRemoteConfig } from 'src/modules/firebase';
import type { ConfigPlugin } from '../ConfigPlugin';
import { promises, resolvers } from '../pluginSystem';

const defaultConfig: FirebaseRemoteConfig = {
  extension_allow_create_wallet: 'false',
};

let firebaseRemoteConfig: null | FirebaseRemoteConfig = null;

export const firebase: ConfigPlugin = {
  onRegister() {
    promises.firebaseRemoteConfig = new Promise<void>((resolve) => {
      resolvers.firebaseRemoteConfig = resolve;
    });
  },

  initialize() {
    fetchRemoteConfig().then((config) => {
      firebaseRemoteConfig = config;
      resolvers.firebaseRemoteConfig();
    });
  },

  /**
   * Reads the parameter value by a given key.
   * The provded key should not include the "extension_' prefix.
   */
  get(key: string) {
    const config = firebaseRemoteConfig ?? defaultConfig;
    const value = config[`extension_${key}`];
    return { value };
  },
};
