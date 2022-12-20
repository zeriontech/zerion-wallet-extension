import * as browserStorage from 'src/background/webapis/storage';
import { knownDapps } from './known-dapps';

type Registry = Record<string, true>;

export async function initialize() {
  /**
   * Refresh dapp registry on each start
   */
  browserStorage.remove('dappRegistry'); // currently no need to await
}

export async function flagAsDapp({
  origin,
}: {
  origin: string;
}): Promise<void> {
  const maybeRegistry = await browserStorage.get<Registry>('dappRegistry');
  const registry = {
    ...maybeRegistry,
    [origin]: true,
  };
  await browserStorage.set('dappRegistry', registry);
}

export async function isFlaggedAsDapp({
  origin,
}: {
  origin: string;
}): Promise<boolean> {
  if (knownDapps.has(origin)) {
    return true;
  }
  const maybeRegistry = await browserStorage.get<Registry>('dappRegistry');
  return maybeRegistry ? maybeRegistry[origin] : false;
}

export function getNameFromOrigin(origin: string) {
  return new URL(origin).hostname;
}
