import { firebase as firebasePlugin } from './plugins/firebase';
import { activatePlugins, registerConfigPlugin, get } from './pluginSystem';

import type { RemoteConfig } from './types';

export type { RemoteConfig };

registerConfigPlugin(firebasePlugin);

export async function initialize() {
  return activatePlugins();
}

export function getRemoteConfigValue(key: keyof RemoteConfig) {
  return get(key);
}
