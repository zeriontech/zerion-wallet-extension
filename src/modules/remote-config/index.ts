import { firebase as firebasePlugin } from './plugins/firebase';
import { activatePlugins, registerConfigPlugin, get } from './pluginSystem';

// Register plugins
registerConfigPlugin(firebasePlugin);

export function initializeRemoteConfig() {
  return activatePlugins();
}

export function getRemoteConfigValue(key: string) {
  return get(key);
}
