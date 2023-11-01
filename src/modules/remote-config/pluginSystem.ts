import type { ConfigPlugin } from './ConfigPlugin';

export const resolvers: {
  [key: string]: () => void;
} = {};

const promises: { [key: string]: Promise<void> } = {};

export function registerPromise(key: string, promise: Promise<void>) {
  promises[key] = promise;
}

const plugins: ConfigPlugin[] = [];

export function registerConfigPlugin(plugin: ConfigPlugin) {
  plugins.push(plugin);
}

export let isReady = false;

export function ready() {
  return Promise.all(Object.values(promises));
}

export async function activatePlugins() {
  if (!plugins.length) {
    isReady = true;
  }
  plugins.forEach((plugin) => plugin.onRegister());
  plugins.forEach((plugin) => plugin.initialize());

  return ready().then(() => {
    isReady = true;
  });
}

export function get(key: string) {
  if (!isReady) {
    throw new Error(
      'You are trying to read value from config before it has initialized'
    );
  }
  let value = undefined;
  for (const plugin of plugins) {
    const result = plugin.get(key);
    if (result) {
      value = result.value;
      break;
    }
  }
  return value;
}
